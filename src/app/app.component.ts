import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from './service/firebase.service';

type Screen =
  | 'countdown'
  | 'expired'
  | 'promise'
  | 'gift'
  | 'wish'
  | 'memory'
  | 'reasons'
  | 'game'
  | 'feedback'
  | 'final';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('bgAudio') bgAudio!: ElementRef<HTMLAudioElement>;

  musicPlaying = false;
  private musicStartedOnce = false;

  memoryAutoTimer: any;
  storyDuration = 9000;
  loadingText = 'Creating her little universe...';
  loadingInterval: any;

  birthdayStart = new Date('2025-01-01T00:00:00+05:30');
  maxUsageSeconds = 30 * 60;

  screen: Screen = 'countdown';
  isLoading = true;
  firebaseOk = true;

  countdownText = '';
  usedSeconds = 0;
  remainingSeconds = this.maxUsageSeconds;

  countdownTimer: any;
  usageTimer: any;
  typeTimer: any;

  typedText = '';
  memoryIndex = 0;
  reasonIndex = 0;

  noText = 'No 😒';
  noButtonStyle: any = {};

  answer1 = '';
  answer2 = '';
  answer3 = '';
  answer4 = '';

  savedResponses: any = {};
  isCompleted = false;

  fallingItems = Array.from({ length: 64 }, (_, i) => {
    const symbols = ['✦', '✧', '♡', '❀', '✿', '✶'];

    return {
      symbol: symbols[i % symbols.length],
      left: (i * 17 + 9) % 100,
      delay: Number(((i * 0.45) % 12).toFixed(2)),
      duration: 11 + (i % 8) * 1.2,
      size: 9 + (i % 6) * 2
    };
  });

  sceneImages: Record<Screen, string> = {
    countdown: 'assets/peace-countdown.jpg',
    expired: 'assets/peace-expired.jpg',
    promise: 'assets/peace-promise.jpg',
    gift: 'assets/peace-gift.jpg',
    wish: 'assets/peace-wish.jpg',
    memory: 'assets/peace-memory.jpg',
    reasons: 'assets/peace-reasons.jpg',
    game: 'assets/peace-game.jpg',
    feedback: 'assets/peace-feedback.jpg',
    final: 'assets/peace-final.jpg'
  };

  // Replace these with your own memory photos later, for example assets/her-photo-1.jpg.
  memoryImages = [
    'assets/peace-countdown1.jpg',
    'assets/peace-promise1.jpg',
    'assets/peace-gift1.jpg',
    'assets/peace-wish1.jpg',
    'assets/peace-reasons1.jpg',
    'assets/peace-game1.jpg',
    'assets/peace-feedback1.jpg',
    'assets/peace-expired1.jpg',
    'assets/peace-memory1.jpg',
    'assets/peace-final.jpg'
  ];

  memoryTitles = [
    'The first smile',
    'A moment I kept',
    'Your little magic',
    'The calm you bring',
    'My favorite feeling',
    'A memory only yours',
    'The way you shine',
    'The reason behind this',
    'Almost at the heart',
    'The final memory'
  ];

  memoryTexts = [
    'This smile... I don’t know why, but it always makes my heart calm.',
    'Some photos are not just photos. They become places where the heart wants to go again.',
    'There is something about you that makes even normal moments feel beautiful.',
    'When I think of peace, I somehow remember you.',
    'You are not just a person in my life. You are a feeling I never want to lose.',
    'This memory is here because it deserves a permanent place, just like you do in my heart.',
    'Your smile has its own language, and somehow my heart understands it every time.',
    'You are the reason this surprise exists. Every screen, every line, every second was for you.',
    'Almost there... but before the final page, I just want you to know how deeply special you are.',
    'This final memory belongs to the heart. The kind of memory someone closes, but still remembers again and again.'
  ];

  reasons = [
    'You make people feel safe just by being yourself.',
    'Your smile can change the mood of an entire day.',
    'You deserve love that feels peaceful, proud, and permanent.',
    'You make simple moments feel like something worth remembering.',
    'You are special in ways words cannot fully explain, but my heart keeps trying anyway.'
  ];

  constructor(private firebase: FirebaseService) {}

  async ngOnInit() {
    const messages = [
      'Collecting memories...',
      'Writing feelings...',
      'Preparing surprises...',
      'Almost ready...'
    ];

    let i = 0;

    this.loadingInterval = setInterval(() => {
      this.loadingText = messages[i];
      i = (i + 1) % messages.length;
    }, 1200);
    document.addEventListener('visibilitychange', this.privacyHandler);

    try {
      await this.firebase.initData();
      await this.loadState();
    } catch (e) {
      console.error(e);
      this.firebaseOk = false;
      this.loadLocalState();
    }

    this.countdownTimer = setInterval(() => this.checkTime(), 1000);
    this.checkTime();
    clearInterval(this.loadingInterval);
    this.isLoading = false;
  }

  ngOnDestroy() {
    clearInterval(this.countdownTimer);
    clearInterval(this.usageTimer);
    clearInterval(this.typeTimer);
    document.removeEventListener('visibilitychange', this.privacyHandler);
    this.bgAudio?.nativeElement?.pause();
  }

  privacyHandler = () => {
    document.body.classList.toggle('privacy-blur', document.hidden);
  };

  // Browsers block audio autoplay until the user interacts with the page.
  // This fires once on the very first tap/click anywhere and quietly starts
  // the music, so the person never has to think about it unless they want
  // to turn it off (or back on) using the toggle button.
  @HostListener('document:click')
  @HostListener('document:touchstart')
  onFirstUserInteraction() {
    if (this.musicStartedOnce || this.isLoading) {
      return;
    }
    // this.musicStartedOnce = true;
    this.playMusic();
  }

  playMusic() {
    const audio = this.bgAudio?.nativeElement;
    if (!audio) {
      return;
    }
    audio.volume = 0.45;
    audio.play()
      .then(() => (this.musicPlaying = true))
      .catch(() => (this.musicPlaying = false));
  }

  toggleMusic() {
    const audio = this.bgAudio?.nativeElement;
    if (!audio) {
      return;
    }
    this.musicStartedOnce = true;

    if (this.musicPlaying) {
      audio.pause();
      this.musicPlaying = false;
    } else {
      this.playMusic();
    }
  }

  async loadState() {
    const data = await this.firebase.getData();
    this.usedSeconds = data.totalUsedSeconds || 0;
    this.remainingSeconds = Math.max(this.maxUsageSeconds - this.usedSeconds, 0);
    this.savedResponses = data.responses || {};
    this.isCompleted = data.isCompleted || false;
  }

  loadLocalState() {
    this.usedSeconds = Number(localStorage.getItem('usedSeconds') || 0);
    this.remainingSeconds = Math.max(this.maxUsageSeconds - this.usedSeconds, 0);
    this.savedResponses = JSON.parse(localStorage.getItem('responses') || '{}');
    this.isCompleted = localStorage.getItem('isCompleted') === 'true';
  }

  async checkTime() {
    const now = new Date();

    if (now < this.birthdayStart) {
      this.screen = 'countdown';
      this.updateCountdown(now);
      return;
    }

    if (this.firebaseOk) {
      await this.loadState();
    } else {
      this.loadLocalState();
    }

    if (this.usedSeconds >= this.maxUsageSeconds) {
      this.screen = 'expired';
      clearInterval(this.usageTimer);
      return;
    }

    if (!this.usageTimer) {
      this.startUsageTracking();
    }

    if (this.isCompleted) {
      this.screen = 'final';
    } else if (this.screen === 'countdown') {
      this.screen = 'promise';
    }
  }

  updateCountdown(now: Date) {
    const diff = this.birthdayStart.getTime() - now.getTime();
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    this.countdownText = `${d}d : ${h}h : ${m}m : ${s}s`;
  }

  startUsageTracking() {
    this.usageTimer = setInterval(async () => {
      this.usedSeconds += 5;
      this.remainingSeconds = Math.max(this.maxUsageSeconds - this.usedSeconds, 0);

      if (this.firebaseOk) {
        try {
          await this.firebase.addUsage(5);
        } catch {
          this.firebaseOk = false;
          localStorage.setItem('usedSeconds', String(this.usedSeconds));
        }
      } else {
        localStorage.setItem('usedSeconds', String(this.usedSeconds));
      }

      if (this.usedSeconds >= this.maxUsageSeconds) {
        this.screen = 'expired';
        clearInterval(this.usageTimer);
      }
    }, 5000);
  }

  go(screen: Screen) {
    this.screen = screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (screen === 'wish') {
      this.typeText(
        'Happy Birthday ❤️ This is not just a website. It is a small place I made so you can feel how special you are to me.'
      );
    }

    if (screen === 'memory') {
      this.memoryIndex = 0;
      this.typeText(this.memoryTexts[0]);
      this.startMemoryStory();
    }

    // if (screen === 'memory') {
    //   this.memoryIndex = 0;
    //   this.typeText(this.memoryTexts[this.memoryIndex]);
    // }

    if (screen === 'reasons') {
      this.reasonIndex = 0;
      this.typeText(this.reasons[this.reasonIndex]);
    }
  }

  startMemoryStory() {
    clearInterval(this.memoryAutoTimer);

    this.memoryAutoTimer = setInterval(() => {
      if (this.screen !== 'memory') {
        clearInterval(this.memoryAutoTimer);
        return;
      }

      this.nextMemory();
    }, this.storyDuration);
  }

  typeText(text: string) {
    clearInterval(this.typeTimer);
    this.typedText = '';
    let i = 0;

    this.typeTimer = setInterval(() => {
      this.typedText += text.charAt(i);
      i++;

      if (i >= text.length) {
        clearInterval(this.typeTimer);
      }
    }, 55);
  }

  giftOpening = false;
  openGift() {
    this.giftOpening = true;
    this.burst();

    setTimeout(() => {
      this.go('wish');
      this.giftOpening = false;
    }, 1500);
  }

  

  nextMemory() {
    clearInterval(this.memoryAutoTimer);

    if (this.memoryIndex < this.memoryImages.length - 1) {
      this.memoryIndex++;
      this.typeText(this.memoryTexts[this.memoryIndex]);
      this.startMemoryStory();
    } else {
      this.go('reasons');
    }
  }

  nextReason() {
    if (this.reasonIndex < this.reasons.length - 1) {
      this.reasonIndex++;
      this.typeText(this.reasons[this.reasonIndex]);
    } else {
      this.go('game');
    }
  }

  async moveNo() {
    this.noText = [
      'No? 😳',
      'Think again 🥺',
      'Wrong answer 😌',
      'Try Yes ❤️',
      'Not possible 😜'
    ][Math.floor(Math.random() * 5)];

    this.noButtonStyle = {
      transform: `translate(${this.random(-130, 130)}px, ${this.random(-90, 90)}px) rotate(${this.random(-18, 18)}deg)`
    };

    if (this.firebaseOk) {
      try {
        await this.firebase.saveNoClick();
      } catch {}
    }
  }

  async yesClicked() {
    await this.saveAnswer('smilePromise', 'YES ❤️');
    this.burst();
    setTimeout(() => this.go('feedback'), 700);
  }

  async submitFeedback() {
    if (!this.answer1 || !this.answer2 || !this.answer3 || !this.answer4) {
      alert('Answer all first... final surprise is waiting ❤️');
      return;
    }

    await this.saveAnswer('likedMost', this.answer1);
    await this.saveAnswer('heartMessage', this.answer2);
    await this.saveAnswer('rating', this.answer3);
    await this.saveAnswer('oneWord', this.answer4);

    if (this.firebaseOk) {
      try {
        await this.firebase.markCompleted();
      } catch {}
    }

    localStorage.setItem('isCompleted', 'true');
    this.isCompleted = true;

    this.burst();
    setTimeout(() => this.go('final'), 900);
  }

  async saveAnswer(key: string, value: string) {
    if (this.firebaseOk) {
      try {
        await this.firebase.saveResponse(key, value);
        return;
      } catch {
        this.firebaseOk = false;
      }
    }

    const old = JSON.parse(localStorage.getItem('responses') || '{}');
    old[key] = { answer: value };
    localStorage.setItem('responses', JSON.stringify(old));
    this.savedResponses = old;
  }

  burst() {
    document.body.classList.add('burst');
    setTimeout(() => document.body.classList.remove('burst'), 1200);
  }

  random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}