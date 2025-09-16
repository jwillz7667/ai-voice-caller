import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await request.json();

    // Validate required fields
    if (!config.sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Create or update the realtime session
    const realtimeSession = await prisma.realtimeSession.upsert({
      where: {
        sessionId: config.sessionId,
      },
      update: {
        configuration: config,
        model: config.model || 'gpt-realtime',
        voice: config.voice || 'marin',
        vadMode: config.turn_detection?.type || 'semantic_vad',
        lastActivity: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        sessionId: config.sessionId,
        callSid: config.callSid || null,
        configuration: config,
        model: config.model || 'gpt-realtime',
        voice: config.voice || 'marin',
        vadMode: config.turn_detection?.type || 'semantic_vad',
        status: 'active',
        startedAt: new Date(),
      },
    });

    // Update the user's active incoming call config if this is being saved as default
    if (config.saveAsDefault) {
      await prisma.incomingCallConfig.upsert({
        where: {
          userId_isActive: {
            userId: session.user.id,
            isActive: true,
          },
        },
        update: {
          model: config.model || 'gpt-realtime',
          configType: config.type || 'realtime',
          instructions: config.instructions || '',
          voice: config.voice || 'marin',
          temperature: config.temperature || 0.8,
          maxTokens: config.max_output_tokens || 4096,
          maxOutputTokens: config.max_output_tokens,
          tools: config.tools || [],
          toolChoice: config.tool_choice || 'auto',
          turnDetection: config.turn_detection || {
            type: 'semantic_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true,
            interrupt_response: true,
            eagerness: 'auto',
          },
          inputAudioFormat: config.input_audio_format || 'pcm16',
          outputAudioFormat: config.output_audio_format || 'pcm16',
          audioConfig: config.audio || null,
          inputAudioTranscription: config.input_audio_transcription || null,
          transcriptionModel: config.input_audio_transcription?.model || 'gpt-4o-transcribe',
          transcriptionLanguage: config.input_audio_transcription?.language || 'en',
          transcriptionPrompt: config.input_audio_transcription?.prompt || null,
          inputAudioNoiseReduction: config.input_audio_noise_reduction || null,
          modalities: config.modalities || ['text', 'audio'],
          promptConfig: config.prompt || null,
          recordCall: config.recordCall !== undefined ? config.recordCall : true,
          outputAudioGain: config.output_audio_gain || 1.0,
          lastUsedAt: new Date(),
          usageCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          name: config.name || 'AI Dashboard Configuration',
          isActive: true,
          model: config.model || 'gpt-realtime',
          configType: config.type || 'realtime',
          instructions: config.instructions || 'You are a helpful AI assistant.',
          voice: config.voice || 'marin',
          temperature: config.temperature || 0.8,
          maxTokens: config.max_output_tokens || 4096,
          maxOutputTokens: config.max_output_tokens,
          tools: config.tools || [],
          toolChoice: config.tool_choice || 'auto',
          turnDetection: config.turn_detection || {
            type: 'semantic_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true,
            interrupt_response: true,
            eagerness: 'auto',
          },
          inputAudioFormat: config.input_audio_format || 'pcm16',
          outputAudioFormat: config.output_audio_format || 'pcm16',
          audioConfig: config.audio || null,
          inputAudioTranscription: config.input_audio_transcription || null,
          transcriptionModel: config.input_audio_transcription?.model || 'gpt-4o-transcribe',
          transcriptionLanguage: config.input_audio_transcription?.language || 'en',
          transcriptionPrompt: config.input_audio_transcription?.prompt || null,
          inputAudioNoiseReduction: config.input_audio_noise_reduction || null,
          modalities: config.modalities || ['text', 'audio'],
          promptConfig: config.prompt || null,
          recordCall: config.recordCall !== undefined ? config.recordCall : true,
          outputAudioGain: config.output_audio_gain || 1.0,
          lastUsedAt: new Date(),
          usageCount: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: realtimeSession.sessionId,
      saved: !!config.saveAsDefault,
    });
  } catch (error: any) {
    console.error("Error saving session config:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configuration" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session configuration
      const realtimeSession = await prisma.realtimeSession.findUnique({
        where: {
          sessionId,
          userId: session.user.id,
        },
      });

      if (!realtimeSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        config: realtimeSession.configuration,
        session: realtimeSession,
      });
    } else {
      // Get user's default configuration
      const config = await prisma.incomingCallConfig.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
        },
      });

      if (!config) {
        return NextResponse.json(
          { error: "No configuration found" },
          { status: 404 }
        );
      }

      // Transform database config to session config format
      const sessionConfig = {
        model: config.model,
        type: config.configType,
        instructions: config.instructions,
        voice: config.voice,
        temperature: config.temperature,
        max_output_tokens: config.maxOutputTokens || config.maxTokens,
        tools: config.tools,
        tool_choice: config.toolChoice,
        turn_detection: config.turnDetection,
        input_audio_format: config.inputAudioFormat,
        output_audio_format: config.outputAudioFormat,
        audio: config.audioConfig,
        input_audio_transcription: config.inputAudioTranscription,
        input_audio_noise_reduction: config.inputAudioNoiseReduction,
        modalities: config.modalities,
        prompt: config.promptConfig,
        recordCall: config.recordCall,
        output_audio_gain: config.outputAudioGain,
      };

      return NextResponse.json({
        success: true,
        config: sessionConfig,
        dbConfig: config,
      });
    }
  } catch (error: any) {
    console.error("Error fetching session config:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}