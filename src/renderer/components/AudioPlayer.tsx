import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import './AudioPlayer.css' // We'll create this CSS file next

interface AudioPlayerProps {
  src: string
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const setAudioData = (): void => {
        setDuration(audio.duration)
        setCurrentTime(audio.currentTime)
      }

      const setAudioTime = (): void => setCurrentTime(audio.currentTime)

      audio.addEventListener('loadeddata', setAudioData)
      audio.addEventListener('timeupdate', setAudioTime)
      audio.addEventListener('ended', () => setIsPlaying(false))

      return () => {
        audio.removeEventListener('loadeddata', setAudioData)
        audio.removeEventListener('timeupdate', setAudioTime)
        audio.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [src]) // Re-run if src changes

  const togglePlayPause = (): void => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => console.error('Error playing audio:', error))
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newVolume = parseFloat(event.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newTime = parseFloat(event.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  return (
    <div className="audio-player-container bg-neutral-800 p-4 rounded-lg shadow-md flex flex-col items-center w-full max-w-md mx-auto">
      <audio ref={audioRef} src={src} className="hidden" />

      <div className="track-info mb-3 text-center">
        {/* Placeholder for track name - can be passed as a prop later */}
        <p className="text-sm text-neutral-400">{src.split('/').pop()}</p>
      </div>

      <div className="controls flex items-center justify-between w-full mb-3">
        <button
          onClick={togglePlayPause}
          className="control-button text-neutral-300 hover:text-white transition-colors p-2"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <div className="time-display text-xs text-neutral-400 mx-2">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="seek-slider w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer mb-3"
        style={{
          background: `linear-gradient(to right, #4f46e5 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%)`
        }}
      />

      <div className="volume-control flex items-center w-full">
        {volume > 0 ? (
          <Volume2 size={20} className="text-neutral-400 mr-2" />
        ) : (
          <VolumeX size={20} className="text-neutral-400 mr-2" />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #4f46e5 ${volume * 100}%, #4b5563 ${volume * 100}%)`
          }}
        />
      </div>
    </div>
  )
}

export default AudioPlayer
