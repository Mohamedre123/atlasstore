'use client'

/* ============================================================
   أصوات مولّدة برمجيًا بـ Web Audio API.
   ------------------------------------------------------------
   ملفات mp3 الخارجية كانت بتفشل في التحميل، والمتصفحات بتمنع
   تشغيل الصوت من غير تفاعل. الطريقة دي مفيهاش ملفات خالص
   وبتشتغل على كل المتصفحات جوه أي حدث من المستخدم.
   ============================================================ */

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    /* سفاري بيعلّق السياق لحد أول تفاعل */
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** كليك مفتاح الإضاءة — نقرة قصيرة جافة */
export function playSwitchClick() {
  const audio = getContext()
  if (!audio) return

  const now = audio.currentTime
  const master = audio.createGain()
  master.gain.value = 0.32
  master.connect(audio.destination)

  /* نقرة ميكانيكية: ضوضاء قصيرة جدًا مفلترة */
  const length = Math.floor(audio.sampleRate * 0.045)
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    /* الضوضاء بتخفت بسرعة عشان تبان كنقرة مش هسهسة */
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 9)
  }

  const noise = audio.createBufferSource()
  noise.buffer = buffer

  const bandpass = audio.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 2100
  bandpass.Q.value = 1.1

  noise.connect(bandpass).connect(master)
  noise.start(now)

  /* لمسة نغمة واطية تدّي إحساس «تَك» معدني */
  const tone = audio.createOscillator()
  const toneGain = audio.createGain()
  tone.type = 'square'
  tone.frequency.setValueAtTime(880, now)
  tone.frequency.exponentialRampToValueAtTime(220, now + 0.04)
  toneGain.gain.setValueAtTime(0.16, now)
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
  tone.connect(toneGain).connect(master)
  tone.start(now)
  tone.stop(now + 0.06)
}
