import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
      user = await prisma.users.findFirst({
        where: { phone: phoneNumber }
      });
    }

    // Fallback to default user for testing
    if (!user) {
      user = await prisma.users.findFirst({
        where: { email: 'user@example.com' }
      });
    }

    if (!user) {
      // Create default user if none exists
      user = await prisma.users.create({ data: {
        id: crypto.randomUUID(),
          email: 'user@example.com',
          name: 'Default User',
          credits: 1000,
        created_at: new Date(),
        updated_at: new Date()
      }
      });
    }

    // Get active incoming call configuration
    let config = await prisma.incoming_call_configs.findFirst({
      where: {
        user_id: user.id,
        is_active: true
      }
    });

    // If no config exists, create a default one
    if (!config) {
      config = await prisma.incoming_call_configs.create({ data: {
        id: crypto.randomUUID(),
          user_id: user.id,
          name: 'Default Incoming Call Configuration',
          instructions: `You are a helpful AI assistant answering phone calls. Be friendly, professional, and concise.
Your primary goal is to help the caller with their request.
If you cannot help with something, politely explain why and offer alternatives.
Always maintain a conversational and natural tone appropriate for phone conversations.`,
          model: 'gpt-realtime',
          voice: 'cedar',
          temperature: 0.8,
          max_tokens: 4096,
          tools: [],
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true,
        created_at: new Date(),
        updated_at: new Date()
      },
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            enabled: false,
            model: 'whisper-1'
          },
          modalities: ['text', 'audio'],
          enable_images: false,
          enable_sip: true,
          enable_mcp: false,
          response_mode: 'streaming',
          is_active: true
        }
      });
    }

    // Format the configuration for the backend
    const formattedConfig = {
      model: config.model,
      voice: config.voice,
      instructions: config.instructions,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      max_output_tokens: config.max_output_tokens || config.max_tokens,
      tools: config.tools || [],
      turn_detection: config.turn_detection,
      input_audio_format: config.input_audio_format,
      output_audio_format: config.output_audio_format,
      input_audio_transcription: config.input_audio_transcription,
      modalities: config.modalities || ['text', 'audio'],
      enable_images: config.enable_images || false,
      enable_sip: config.enable_sip !== false,
      enable_mcp: config.enable_mcp || false,
      response_mode: config.response_mode || 'streaming',
      noise_reduction: config.noise_reduction !== false,
      echo_cancellation: config.echo_cancellation !== false,
      automatic_gain_control: config.automatic_gain_control !== false,
      tool_choice: config.tool_choice || 'auto',
      parallel_tool_calls: config.parallel_tool_calls !== false,
      max_response_output_tokens: config.max_response_output_tokens,
      conversation_id: config.conversation_id,
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