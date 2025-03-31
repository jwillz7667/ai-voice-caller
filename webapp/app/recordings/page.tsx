"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Trash2, PlayCircle, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Recording {
  sid: string;
  status: string;
  url: string;
  duration?: string;
  channels?: string;
  source?: string;
  callSid: string;
  timestamp: string;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecordings = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081'}/recordings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }
      
      const data = await response.json();
      setRecordings(data);
      setError(null);
    } catch (err) {
      setError('Error loading recordings. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleDelete = async (sid: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081'}/recordings/${sid}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }
      
      setRecordings(recordings.filter(r => r.sid !== sid));
      toast({
        title: "Recording deleted",
        description: "The recording has been permanently deleted",
      });
    } catch (err) {
      toast({
        title: "Error deleting recording",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error(err);
    }
  };

  const handlePlay = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownload = (url: string, sid: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${sid}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Call Recordings</h1>
          <p className="text-gray-500 text-sm">
            Manage and listen to your recorded calls
          </p>
        </div>
        <Button 
          onClick={fetchRecordings} 
          size="sm" 
          variant="outline" 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-pulse">Loading recordings...</div>
        </div>
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-gray-500 mb-4">No recordings found</p>
            <p className="text-center text-sm text-gray-400">
              Enable call recording in Settings to record your calls
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recordings ({recordings.length})</CardTitle>
            <CardDescription>
              All your call recordings in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((recording) => (
                  <TableRow key={recording.sid}>
                    <TableCell>
                      {new Date(recording.timestamp).toLocaleString()}
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(recording.timestamp), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs
                        ${recording.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          recording.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {recording.status}
                      </span>
                    </TableCell>
                    <TableCell>{recording.duration ? `${recording.duration}s` : 'N/A'}</TableCell>
                    <TableCell>
                      {recording.channels === 'dual' ? 'Dual Channel' : 'Mono'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => handlePlay(recording.url)}
                          disabled={recording.status !== 'completed'}
                          title="Play recording"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => handleDownload(recording.url, recording.sid)}
                          disabled={recording.status !== 'completed'}
                          title="Download recording"
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => handleDelete(recording.sid)}
                          className="text-red-500"
                          title="Delete recording"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 