'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Download, Phone, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Recording {
  id: string;
  recordingSid: string;
  recordingUrl: string;
  duration: number;
  status: string;
  createdAt: string;
  callLog: {
    phoneNumber: string;
    direction: string;
    duration: number;
    startedAt: string;
    status: string;
  };
}

export default function RecordingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecordings, setTotalRecordings] = useState(0);
  const recordingsPerPage = 10;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchRecordings();
    }
  }, [user, currentPage]);

  const fetchRecordings = async () => {
    try {
      setLoadingRecordings(true);
      const offset = (currentPage - 1) * recordingsPerPage;
      const response = await fetch(`/api/recordings?limit=${recordingsPerPage}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }
      
      const data = await response.json();
      setRecordings(data.recordings);
      setTotalRecordings(data.total);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePlay = (recordingId: string, recordingUrl: string) => {
    if (playingId === recordingId) {
      // Stop playing
      const audio = document.getElementById(`audio-${recordingId}`) as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      // Stop any currently playing audio
      if (playingId) {
        const currentAudio = document.getElementById(`audio-${playingId}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }
      
      // Start playing new audio
      setPlayingId(recordingId);
      const audio = document.getElementById(`audio-${recordingId}`) as HTMLAudioElement;
      if (audio) {
        audio.play();
        audio.onended = () => setPlayingId(null);
      }
    }
  };

  const handleDownload = async (recordingUrl: string, phoneNumber: string, date: string) => {
    try {
      // For Twilio recordings, we need to append .mp3 to get the audio file
      const audioUrl = recordingUrl.includes('.mp3') ? recordingUrl : `${recordingUrl}.mp3`;
      
      // Create a filename based on phone number and date
      const fileName = `recording-${phoneNumber}-${new Date(date).getTime()}.mp3`;
      
      // Open in new tab for download
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading recording:', error);
    }
  };

  const totalPages = Math.ceil(totalRecordings / recordingsPerPage);

  if (loading || loadingRecordings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Call Recordings</h1>
            <p className="text-muted-foreground mt-2">
              Listen to and download your call recordings
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {recordings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No recordings yet</p>
            <p className="text-muted-foreground mt-2">Your call recordings will appear here</p>
            <Link href="/dashboard">
              <Button className="mt-4">Make a Call</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {recordings.map((recording) => (
              <Card key={recording.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {recording.callLog.phoneNumber}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(recording.callLog.startedAt)}
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3" />
                          {formatDuration(recording.duration)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={recording.callLog.direction === 'outbound' ? 'default' : 'secondary'}>
                        {recording.callLog.direction}
                      </Badge>
                      <Badge variant={recording.status === 'completed' ? 'success' : 'secondary'}>
                        {recording.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={playingId === recording.id ? 'secondary' : 'outline'}
                      onClick={() => handlePlay(recording.id, recording.recordingUrl)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {playingId === recording.id ? 'Stop' : 'Play'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(
                        recording.recordingUrl,
                        recording.callLog.phoneNumber,
                        recording.callLog.startedAt
                      )}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <audio
                      id={`audio-${recording.id}`}
                      src={recording.recordingUrl.includes('.mp3') ? recording.recordingUrl : `${recording.recordingUrl}.mp3`}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}