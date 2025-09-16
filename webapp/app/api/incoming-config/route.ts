import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getUserFromCookie() {
  const cookieStore = cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) return null;

  return await prisma.user.findUnique({
    where: { email: userEmail }
  });
}

export async function GET(_req: NextRequest) {
  try {
    // Get user from cookie or create a default one for testing
    let user = await getUserFromCookie();

    if (!user) {
      // For development/testing, get or create a default user
      const defaultEmail = 'user@example.com';
      user = await prisma.user.findUnique({
        where: { email: defaultEmail }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: defaultEmail,
            name: 'Default User',
            credits: 1000
          }
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'ash',
          temperature: 0.8,
          maxTokens: 4096,
          tools: [],
          turnDetection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          inputAudioFormat: 'pcm16',
          outputAudioFormat: 'pcm16',
          isActive: true
        }
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching incoming call config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get user from cookie or use default
    let user = await getUserFromCookie();

    if (!user) {
      const defaultEmail = 'user@example.com';
      user = await prisma.user.findUnique({
        where: { email: defaultEmail }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      instructions,
      model,
      voice,
      temperature,
      maxTokens,
      maxOutputTokens,
      tools,
      turnDetection,
      inputAudioFormat,
      outputAudioFormat,
      inputAudioTranscription,
      modalities,
      enable_images,
      enable_sip,
      enable_mcp,
      response_mode,
      noise_reduction,
      echo_cancellation,
      automatic_gain_control,
      tool_choice,
      parallel_tool_calls,
      max_response_output_tokens,
      conversation_id,
      metadata
    } = body;

    // Deactivate any existing active configurations
    await prisma.incomingCallConfig.updateMany({
      where: {
        userId: user.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Create or update the configuration
    const config = await prisma.incomingCallConfig.create({
      data: {
        userId: user.id,
        name: name || 'Incoming Call Configuration',
        instructions,
        model,
        voice,
        temperature,
        maxTokens,
        maxOutputTokens,
        tools: tools || [],
        turnDetection: turnDetection || {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
          eagerness: 'auto',
          interrupt_response: true
        },
        inputAudioFormat: inputAudioFormat || 'pcm16',
        outputAudioFormat: outputAudioFormat || 'pcm16',
        inputAudioTranscription,
        modalities: modalities || ['text', 'audio'],
        enableImages: enable_images || false,
        enableSip: enable_sip !== false,
        enableMcp: enable_mcp || false,
        responseMode: response_mode || 'streaming',
        noiseReduction: noise_reduction !== false,
        echoCancellation: echo_cancellation !== false,
        automaticGainControl: automatic_gain_control !== false,
        toolChoice: tool_choice || 'auto',
        parallelToolCalls: parallel_tool_calls !== false,
        maxResponseOutputTokens: max_response_output_tokens,
        conversationId: conversation_id,
        metadata,
        isActive: true
      }
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error saving incoming call config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get user from cookie or use default
    let user = await getUserFromCookie();

    if (!user) {
      const defaultEmail = 'user@example.com';
      user = await prisma.user.findUnique({
        where: { email: defaultEmail }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
    }

    // Verify ownership
    const existingConfig = await prisma.incomingCallConfig.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Update the configuration
    const config = await prisma.incomingCallConfig.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error updating incoming call config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}