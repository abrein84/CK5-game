/**
 * Music player for loaded MP3 files with beat detection
 */

export class MusicEngine {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private beatCallbacks: ((beat: number) => void)[] = [];
  private lastBeatTime = 0;
  private beatCount = 0;
  private detectedBPM = 120;
  private animationFrame: number | null = null;

  async init() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
  }

  async loadSong(songPath: string) {
    // Create audio element
    this.audio = new Audio();
    this.audio.src = songPath;
    this.audio.preload = "auto";

    // Wait for song to be ready
    await new Promise((resolve, reject) => {
      this.audio!.addEventListener('loadeddata', resolve, { once: true });
      this.audio!.addEventListener('error', () => reject(new Error("Song load failed")), { once: true });
      this.audio!.load();
    });

    // Connect to analyzer for beat detection
    if (this.audioContext && this.analyser && !this.sourceNode) {
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
  }

  start() {
    if (!this.audio || this.isPlaying) return;

    this.audio.play();
    this.isPlaying = true;
    this.lastBeatTime = Date.now();

    // Start beat detection loop
    this.detectBeats();
  }

  stop() {
    if (!this.audio) return;

    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  onBeat(callback: (beat: number) => void) {
    this.beatCallbacks.push(callback);
  }

  getIntensity(): number {
    if (!this.analyser) return 0.5;

    // Get frequency data to calculate intensity
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average intensity from low-mid frequencies (bass/rhythm range)
    let sum = 0;
    const lowMidRange = Math.floor(dataArray.length * 0.3); // Focus on lower frequencies
    for (let i = 0; i < lowMidRange; i++) {
      sum += dataArray[i];
    }
    const average = sum / lowMidRange;

    // Normalize to 0-1
    return Math.min(average / 200, 1);
  }

  getBPM(): number {
    return this.detectedBPM;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }

  private detectBeats() {
    if (!this.isPlaying || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Focus on bass frequencies for kick drum detection
    const bassRange = 10; // First 10 bins are bass frequencies
    let bassSum = 0;
    for (let i = 0; i < bassRange; i++) {
      bassSum += dataArray[i];
    }
    const bassLevel = bassSum / bassRange;

    // Simple threshold-based beat detection
    const beatThreshold = 150;
    const now = Date.now();
    const timeSinceLastBeat = now - this.lastBeatTime;
    const minBeatInterval = 300; // Min 300ms between beats (~200 BPM max)

    if (bassLevel > beatThreshold && timeSinceLastBeat > minBeatInterval) {
      // Beat detected!
      this.beatCount++;
      this.lastBeatTime = now;

      // Estimate BPM from beat intervals
      if (timeSinceLastBeat < 1000) { // Only use reasonable intervals
        const instantBPM = 60000 / timeSinceLastBeat;
        // Smooth BPM changes
        this.detectedBPM = this.detectedBPM * 0.9 + instantBPM * 0.1;
      }

      // Trigger callbacks
      this.beatCallbacks.forEach(cb => cb(this.beatCount));
    }

    // Continue detection loop
    this.animationFrame = requestAnimationFrame(() => this.detectBeats());
  }
}
