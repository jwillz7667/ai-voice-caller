import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This endpoint is specifically for the backend to fetch incoming call configuration
export async function GET(req: NextRequest) {
  try {
    // Get phone number from query params (from Twilio webhook)
    const phoneNumber = req.nextUrl.searchParams.get('phone');

    // For now, use a default user or lookup by phone
    // In production, you'd match the phone number to a user
    let user;

    if (phoneNumber) {
      // Try to find user by phone number
      user = await prisma.user.findFirst({
        where: { phone: phoneNumber }
      });
    }

    // Fallback to default user for testing
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: 'user@example.com' }
      });
    }

    if (!user) {
      // Create default user if none exists
      user = await prisma.user.create({
        data: {
          email: 'user@example.com',
          name: 'Default User',
          credits: 1000
        }
      });
    }

    // Get active incoming call configuration
    let config = await prisma.incomingCallConfig.findFirst({
      where: {
        userId: user.id,
        isActive: true
      }
    });

    // If no config exists, create a default one
    if (!config) {
      config = await prisma.incomingCallConfig.create({
        data: {
          userId: user.id,
          name: 'Default Incoming Call Configuration',
          instructions: `You are a helpful AI assistant answering phone calls. Be friendly, professional, and concise.
Your primary goal is to help the caller with their request.
If you cannot help with something, politely explain why and offer alternatives.
Always maintain a conversational and natural tone appropriate for phone conversations.`,
          model: 'gpt-realtime',
          voice: 'cedar',
          temperature: 0.8,
          maxTokens: 4096,
          tools: [],
          turnDetection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true
          },
          inputAudioFormat: 'pcm16',
          outputAudioFormat: 'pcm16',
          inputAudioTranscription: {
            enabled: false,
            model: 'whisper-1'
          },
          modalities: ['text', 'audio'],
          enable_images: false,
          enable_sip: true,
          enable_mcp: false,
          response_mode: 'streaming',
          isActive: true
        }
      });
    }

    // Format the configuration for the backend
    const formattedConfig = {
      model: config.model,
      voice: config.voice,
      instructions: config.instructions,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      max_output_tokens: config.maxOutputTokens || config.maxTokens,
      tools: config.tools || [],
      turn_detection: config.turnDetection,
      input_audio_format: config.inputAudioFormat,
      output_audio_format: config.outputAudioFormat,
      input_audio_transcription: config.inputAudioTranscription,
      modalities: config.modalities || ['text', 'audio'],
      enable_images: config.enableImages || false,
      enable_sip: config.enableSip !== false,
      enable_mcp: config.enableMcp || false,
      response_mode: config.responseMode || 'streaming',
      noise_reduction: config.noiseReduction !== false,
      echo_cancellation: config.echoCancellation !== false,
      automatic_gain_control: config.automaticGainControl !== false,
      tool_choice: config.toolChoice || 'auto',
      parallel_tool_calls: config.parallelToolCalls !== false,
      max_response_output_tokens: config.maxResponseOutputTokens,
      conversation_id: config.conversationId,
      metadata: config.metadata
    };

    return NextResponse.json({
      success: true,
      config: formattedConfig
    });
  } catch (error) {
    console.error('Error fetching incoming call config for backend:', error);

    // Return a default configuration if there's an error
    return NextResponse.json({
      success: false,
      config: {
        model: 'gpt-realtime',
        voice: 'cedar',
        instructions: 'You are a helpful AI assistant. Be friendly and professional.',
        temperature: 0.8,
        max_tokens: 4096,
        tools: [],
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        modalities: ['text', 'audio']
      }
    });
  }
}