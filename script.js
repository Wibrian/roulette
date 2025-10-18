/* ============================================================
   🎯 SPIN ROULETTE DOORPRIZE — POINTER JAM 3 (KANAN)
   - Pemenang berhenti tepat di sisi kanan roda.
   - Teks hadiah horizontal (tidak terbalik).
   - Kode bersih dan mudah dipahami.
   ============================================================ */

// --- Variabel utama ---
let prizes = { karyawan: [], non_karyawan: [] }
let participants = []
let spinning = false
let spinCount = 0

// --- Elemen DOM ---
const wheelCanvas = document.getElementById("wheelCanvas")
const ctx = wheelCanvas.getContext("2d")
const spinBtn = document.getElementById("spinBtn")
const resetBtn = document.getElementById("resetBtn")
const resultBox = document.getElementById("resultBox")
const participantsList = document.getElementById("participantsList")
const spinCountEl = document.getElementById("spinCount")

// --- Konfigurasi roda ---
const size = wheelCanvas.width
const cx = size / 2
const cy = size / 2
const radius = Math.min(cx, cy) - 4

// --- Fungsi bantu ---
function randInt(max) {
  return Math.floor(Math.random() * max)
}

// ============================================================
// 1️⃣ MUAT DATA HADIAH DARI data.json
// ============================================================
fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    prizes = data
    generateParticipants()
    renderParticipants()
    drawWheel(0)
  })

// ============================================================
// 2️⃣ BUAT PESERTA (11 karyawan + 28 non-karyawan)
// ============================================================
function generateParticipants() {
  const karyawan = ["Andi", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita", "Hadi", "Indra"]

  const nonKaryawan = [
    "Lina",
    "Maya",
    "Nina",
    "Oscar",
    "Putra",
    "Qori",
    "Rian",
    "Santi",
    "Tono",
    "Umar",
    "Vina",
    "Wawan",
    "Xena",
    "Yogi",
    "Zahra",
    "Bagus",
    "Cahya",
    "Dimas",
    "Elin",
    "Fani",
    "Galuh",
    "Hana",
    "Irwan",
    "Jihan",
    "Karin",
    "Lutfi",
    "Mega",
  ]

  participants = [
    ...karyawan.map((n) => ({ name: n, type: "karyawan" })),
    ...nonKaryawan.map((n) => ({ name: n, type: "non_karyawan" })),
  ]
}

// ============================================================
// 3️⃣ TAMPILKAN DAFTAR PESERTA DI PANEL KIRI
// ============================================================
function renderParticipants() {
  participantsList.innerHTML = ""
  participants.forEach((p, i) => {
    const div = document.createElement("div")
    div.className = "participant " + (p.type === "karyawan" ? "emp" : "non")
    div.innerHTML = `<div>${i + 1}. ${p.name}</div><div>#${i + 1}</div>`
    participantsList.appendChild(div)
  })
}

// ============================================================
// 4️⃣ GAMBAR RODA DENGAN LABEL HADIAH
// ============================================================
function drawWheel(rotation = 0) {
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)

  const allPrizes = [
    ...prizes.karyawan.map((p) => ({ ...p, type: "karyawan" })),
    ...prizes.non_karyawan.map((p) => ({ ...p, type: "non_karyawan" })),
  ]

  const segmentCount = allPrizes.length
  const segmentAngle = (Math.PI * 2) / segmentCount

  for (let i = 0; i < segmentCount; i++) {
    const start = i * segmentAngle
    const end = start + segmentAngle

    // Warna selang-seling
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, start, end)
    ctx.closePath()
    ctx.fillStyle = i % 2 === 0 ? "#fff" : "#f8f8f8"
    ctx.fill()
    ctx.strokeStyle = "#ddd"
    ctx.stroke()

    // --- Tulis nama hadiah horizontal (menghadap kanan) ---
    ctx.save()
    const mid = (start + end) / 2
    ctx.rotate(mid)
    ctx.translate(radius * 0.75, 0)
    ctx.rotate(0)
    ctx.font = "bold 14px Arial"
    ctx.fillStyle = "#333"
    ctx.textAlign = "center"
    ctx.fillText(allPrizes[i].name, 0, 0)
    ctx.restore()
  }

  // Lingkaran tengah roda
  ctx.beginPath()
  ctx.arc(0, 0, 40, 0, Math.PI * 2)
  ctx.fillStyle = "#fff"
  ctx.fill()
  ctx.strokeStyle = "#eee"
  ctx.stroke()

  // Garis panduan ke arah pointer kanan (jam 3)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(radius, 0)
  ctx.strokeStyle = "rgba(255,0,0,0.3)"
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}

// ============================================================
// 5️⃣ LOGIKA SPIN & ANIMASI
// ============================================================
spinBtn.addEventListener("click", () => {
  if (spinning) return
  spinning = true
  spinBtn.disabled = true
  resetBtn.disabled = true

  const allPrizes = [
    ...prizes.karyawan.map((p) => ({ ...p, type: "karyawan" })),
    ...prizes.non_karyawan.map((p) => ({ ...p, type: "non_karyawan" })),
  ]

  const segmentCount = allPrizes.length
  const segmentAngle = (Math.PI * 2) / segmentCount

  // Pilih pemenang acak
  const winnerIndex = randInt(segmentCount)
  const winnerParticipant = participants[randInt(participants.length)]

  // Hitung rotasi agar segmen pemenang berhenti di kanan (jam 3)
  const segmentMidAngle = winnerIndex * segmentAngle + segmentAngle / 2
  const targetRotation = 0 - segmentMidAngle

  // Tambahkan beberapa putaran agar tampak realistis
  const extraRounds = 10 + randInt(4) // 6–9 putaran
  const finalRotation = targetRotation + extraRounds * Math.PI * 2

  // Durasi animasi (ms)
  const duration = 10000
  const startTime = performance.now()

  // Fungsi easing (pelan di akhir)
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 4)
  }

  // Animasi rotasi
  function animate(time) {
    const elapsed = time - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)
    const currentRotation = (finalRotation - 0) * eased

    drawWheel(currentRotation)

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      spinning = false
      spinBtn.disabled = false
      resetBtn.disabled = false
      spinCount++
      spinCountEl.textContent = "Spins: " + spinCount

      // Hitung segmen yang berhenti di pointer kanan (jam 3)
      let angleAtPointer = (-finalRotation + 0) % (Math.PI * 2)
      if (angleAtPointer < 0) angleAtPointer += Math.PI * 2
      let finalIndex = Math.floor((angleAtPointer / segmentAngle + 0.5) % segmentCount)

      const prize = allPrizes[finalIndex]

      // Tampilkan hasil
      resultBox.innerHTML = `
        🎉 <strong>${winnerParticipant.name}</strong><br>
        Mendapatkan: <strong>${prize.name}</strong>
      `

      // Tampilkan gambar hadiah jika ada
      let imgEl = document.getElementById("prizeImageSmall")
      if (!imgEl) {
        imgEl = document.createElement("img")
        imgEl.id = "prizeImageSmall"
        imgEl.style.marginTop = "10px"
        imgEl.style.width = "120px"
        imgEl.style.height = "120px"
        imgEl.style.objectFit = "contain"
        imgEl.style.borderRadius = "8px"
        resultBox.appendChild(imgEl)
      }

      if (prize.image && prize.image.trim() !== "") {
        imgEl.src = prize.image
        imgEl.style.display = "block"
      } else {
        imgEl.style.display = "none"
      }

      highlightParticipant(winnerParticipant.name)
    }
  }

  requestAnimationFrame(animate)
})

// ============================================================
// 6️⃣ HIGHLIGHT PEMENANG DI PANEL KIRI
// ============================================================
function highlightParticipant(name) {
  const nodes = participantsList.querySelectorAll(".participant")
  nodes.forEach((n) => {
    n.style.boxShadow = ""
    n.style.border = ""
    if (n.textContent.includes(name)) {
      n.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"
      n.style.border = "1px solid var(--accent)"
      n.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  })
}

// ============================================================
// 7️⃣ RESET
// ============================================================
resetBtn.addEventListener("click", () => {
  spinCount = 0
  spinCountEl.textContent = "Spins: 0"
  resultBox.textContent = "Hasil: -"
  drawWheel(0)
  participantsList.querySelectorAll(".participant").forEach((n) => ((n.style.boxShadow = ""), (n.style.border = "")))
})
