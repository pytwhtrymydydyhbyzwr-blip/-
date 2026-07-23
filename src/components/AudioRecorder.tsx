import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, Radio } from 'lucide-react';

interface AudioRecorderProps {
  existingAudioUrl?: string;
  onSaveAudio: (audioUrl: string | undefined, duration: number) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  existingAudioUrl,
  onSaveAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(existingAudioUrl);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setAudioUrl(existingAudioUrl);
  }, [existingAudioUrl]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setRecordingError(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('המיקרופון אינו נתמך בדפדפן זה');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioUrl(base64Audio);
          onSaveAudio(base64Audio, recordingSeconds);
        };

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.warn('Real microphone error, using simulated audio recording fallback:', err);
      setRecordingError('לא ניתן לגשת למיקרופון. מפעיל מערכת סימולציית הקלטה חלופית.');
      startSimulatedRecording();
    }
  };

  const startSimulatedRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 5) {
          stopSimulatedRecording(prev + 1);
          return 5;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopSimulatedRecording = (finalDuration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    
    // Create a dummy audio blob with a beep/tone or silent audio data URI
    const dummyAudioBase64 =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    setAudioUrl(dummyAudioBase64);
    setAudioDuration(finalDuration);
    onSaveAudio(dummyAudioBase64, finalDuration);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setAudioDuration(recordingSeconds);
      mediaRecorderRef.current.stop();
    } else {
      stopSimulatedRecording(recordingSeconds);
    }
  };

  const handleTogglePlay = () => {
    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch((err) => {
        console.warn('Audio play error:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleDeleteAudio = () => {
    setAudioUrl(undefined);
    setIsPlaying(false);
    setAudioDuration(0);
    onSaveAudio(undefined, 0);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>הודעה קולית ליומן היומי</span>
        </label>
        {audioUrl && !isRecording && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            הקלטה שמורה ✓
          </span>
        )}
      </div>

      {recordingError && (
        <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl mb-2 border border-amber-200">
          {recordingError}
        </div>
      )}

      {/* Recording in progress state */}
      {isRecording && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-700">
              מקליט... {formatSeconds(recordingSeconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>סיום הקלטה</span>
          </button>
        </div>
      )}

      {/* Has recorded audio player */}
      {!isRecording && audioUrl && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div>
              <div className="text-xs font-bold text-slate-800">הקלטה קולית</div>
              <div className="text-[10px] text-slate-500 font-mono">
                {audioDuration > 0 ? formatSeconds(audioDuration) : '00:05'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDeleteAudio}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
            title="מחק הקלטה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Start recording button */}
      {!isRecording && !audioUrl && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Mic className="w-4 h-4 text-rose-500" />
          <span>לחץ להקלטת הודעה קולית (עד דקה)</span>
        </button>
      )}
    </div>
  );
};
