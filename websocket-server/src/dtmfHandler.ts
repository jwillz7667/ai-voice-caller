/**
 * DTMF (Dual-Tone Multi-Frequency) Handler
 * Manages DTMF tone sending and receiving for Twilio Media Streams
 * According to Twilio best practices
 */

import twilio from 'twilio';
import { WebSocket } from 'ws';

interface DTMFEvent {
  event: 'dtmf';
  streamSid: string;
  sequenceNumber?: string;
  dtmf: {
    track: 'inbound_track';
    digit: string;
  };
}

interface DTMFQueueItem {
  digit: string;
  duration?: number; // milliseconds
  pauseAfter?: number; // milliseconds
}

export class DTMFHandler {
  private twilioClient?: twilio.Twilio;
  private dtmfQueue: DTMFQueueItem[] = [];
  private isProcessingQueue = false;
  private currentCallSid?: string;
  private streamSid?: string;

  constructor() {
    // Initialize Twilio client if credentials are available
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  /**
   * Set the current call and stream identifiers
   */
  setCallContext(callSid: string, streamSid: string) {
    this.currentCallSid = callSid;
    this.streamSid = streamSid;
  }

  /**
   * Handle incoming DTMF event from Twilio
   * This occurs when a user presses a key during the call
   */
  handleIncomingDTMF(event: DTMFEvent): { digit: string; timestamp: string } {
    console.log(`[DTMF] Received digit '${event.dtmf.digit}' from stream ${event.streamSid}`);

    return {
      digit: event.dtmf.digit,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send DTMF digits using Twilio REST API
   * This is the recommended approach for sending DTMF tones mid-call
   */
  async sendDTMFViaAPI(digits: string): Promise<boolean> {
    if (!this.twilioClient || !this.currentCallSid) {
      console.error('[DTMF] Cannot send DTMF: Missing Twilio client or call SID');
      return false;
    }

    try {
      // Use Twilio's Call resource to play DTMF digits
      await this.twilioClient
        .calls(this.currentCallSid)
        .update({
          twiml: `<Response><Play digits="${digits}"/></Response>`
        });

      console.log(`[DTMF] Successfully sent digits '${digits}' to call ${this.currentCallSid}`);
      return true;
    } catch (error) {
      console.error('[DTMF] Error sending DTMF via API:', error);
      return false;
    }
  }

  /**
   * Send DTMF digits with proper timing and pauses
   * Supports w (0.5s pause) and W (1s pause) characters
   */
  async sendDTMFSequence(sequence: string): Promise<boolean> {
    const processedSequence = this.processDigitSequence(sequence);

    for (const item of processedSequence) {
      if (item.digit === 'pause') {
        // Wait for the specified pause duration
        await this.sleep(item.duration || 500);
      } else {
        // Send the actual digit
        const success = await this.sendDTMFViaAPI(item.digit);
        if (!success) {
          console.error(`[DTMF] Failed to send digit '${item.digit}'`);
          return false;
        }

        // Add pause after digit if specified
        if (item.pauseAfter) {
          await this.sleep(item.pauseAfter);
        }
      }
    }

    return true;
  }

  /**
   * Queue DTMF digits for sequential sending
   * Useful for dialing extensions or navigating IVR menus
   */
  queueDTMF(digits: string, delayBetween: number = 100) {
    const digitArray = digits.split('');

    digitArray.forEach((digit, index) => {
      this.dtmfQueue.push({
        digit,
        pauseAfter: index < digitArray.length - 1 ? delayBetween : 0
      });
    });

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process the DTMF queue
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.dtmfQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.dtmfQueue.length > 0) {
      const item = this.dtmfQueue.shift();
      if (!item) continue;

      await this.sendDTMFViaAPI(item.digit);

      if (item.pauseAfter) {
        await this.sleep(item.pauseAfter);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Process digit sequence with pause characters
   * w = 0.5s pause, W = 1s pause
   */
  private processDigitSequence(sequence: string): DTMFQueueItem[] {
    const items: DTMFQueueItem[] = [];
    const chars = sequence.split('');

    chars.forEach(char => {
      if (char === 'w') {
        items.push({ digit: 'pause', duration: 500 });
      } else if (char === 'W') {
        items.push({ digit: 'pause', duration: 1000 });
      } else if (/[0-9A-D#*]/.test(char)) {
        items.push({ digit: char });
      }
    });

    return items;
  }

  /**
   * Send DTMF for IVR navigation
   * Common patterns for navigating phone trees
   */
  async navigateIVR(options: {
    menuOption?: string;
    extension?: string;
    pinCode?: string;
    waitBeforeMenu?: number;
    waitBeforeExtension?: number;
  }): Promise<boolean> {
    const { menuOption, extension, pinCode, waitBeforeMenu = 2000, waitBeforeExtension = 1000 } = options;

    // Wait for IVR greeting
    if (waitBeforeMenu > 0) {
      await this.sleep(waitBeforeMenu);
    }

    // Send menu option
    if (menuOption) {
      console.log(`[DTMF] Selecting menu option: ${menuOption}`);
      await this.sendDTMFSequence(menuOption);
    }

    // Wait before extension
    if (extension && waitBeforeExtension > 0) {
      await this.sleep(waitBeforeExtension);
    }

    // Send extension
    if (extension) {
      console.log(`[DTMF] Dialing extension: ${extension}`);
      await this.sendDTMFSequence(extension + '#'); // Add # to confirm extension
    }

    // Send PIN if provided
    if (pinCode) {
      await this.sleep(1000);
      console.log(`[DTMF] Entering PIN code`);
      await this.sendDTMFSequence(pinCode + '#');
    }

    return true;
  }

  /**
   * Validate DTMF digit or sequence
   */
  static isValidDTMF(digit: string): boolean {
    // Valid DTMF characters: 0-9, A-D, *, #, w (pause), W (long pause)
    return /^[0-9A-D*#wW]+$/.test(digit);
  }

  /**
   * Format phone number for DTMF sending
   * Removes non-digit characters except for valid DTMF chars
   */
  static formatForDTMF(input: string): string {
    // Remove spaces, dashes, parentheses, but keep valid DTMF chars
    return input.replace(/[^0-9A-D*#wW]/g, '');
  }

  /**
   * Helper function to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the DTMF queue
   */
  clearQueue() {
    this.dtmfQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.dtmfQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }
}

// Export singleton instance
export const dtmfHandler = new DTMFHandler();