/* ============================================================
   🎯 SPIN ROULETTE DOORPRIZE — POINTER JAM 3 (KANAN)
   - Menggunakan data.json dengan struktur employees / nonEmployees
   - Hadiah dibedakan otomatis sesuai kategori peserta
   - Pemenang berhenti tepat di sisi kanan roda
   ============================================================ */

// --- Variabel utama ---
let data = { employees: {}, nonEmployees: {} }
let participants = []
let allPrizes = []
let spinning = false
let spinCount = 0
let winners = []

// --- Elemen DOM ---
const wheelCanvas = document.getElementById("wheelCanvas")
const ctx = wheelCanvas.getContext("2d")
const spinBtn = document.getElementById("spinBtn")
const resetBtn = document.getElementById("resetBtn")
const resultBox = document.getElementById("resultBox")
const participantsList = document.getElementById("participantsList")
const spinCountEl = document.getElementById("spinCount")

// --- Ukuran roda ---
const size = wheelCanvas.width
const cx = size / 2
const cy = size / 2
const radius = Math.min(cx, cy) - 4

// --- Fungsi bantu ---
function randInt(max) {
  return Math.floor(Math.random() * max)
}

// ============================================================
// 1️⃣ MUAT DATA DARI data.json
// ============================================================
fetch("data.json")
  .then((res) => res.json())
  .then((json) => {
    data = json
    generateParticipants()
    generatePrizes()
    renderParticipants()
    drawWheel(0)
  })

// ============================================================
// 2️⃣ GENERATE PESERTA DARI DATA
// ============================================================
function generateParticipants() {
  const emp = data.employees.names.map((n) => ({ name: n, type: "employee" }))
  const non = data.nonEmployees.names.map((n) => ({ name: n, type: "nonEmployee" }))
  participants = [...emp, ...non]
}

// ============================================================
// 3️⃣ GENERATE HADIAH DARI DATA
// ============================================================
function generatePrizes() {
  const empPrizes = data.employees.prizes.map((p) => ({ name: p.name, image: p.image, type: "employee" }))
  const nonPrizes = data.nonEmployees.prizes.map((p) => ({ name: p.name, image: p.image, type: "nonEmployee" }))
  allPrizes = [...empPrizes, ...nonPrizes]
}

// ============================================================
// 4️⃣ TAMPILKAN PESERTA DI PANEL KIRI
// ============================================================
function renderParticipants() {
  participantsList.innerHTML = ""
  participants.forEach((p, i) => {
    const div = document.createElement("div")
    div.className = "participant " + (p.type === "employee" ? "emp" : "non")
    div.innerHTML = `<div>${i + 1}. ${p.name}</div><div>#${i + 1}</div>`
    participantsList.appendChild(div)
  })
}

// ============================================================
// 5️⃣ GAMBAR RODA DENGAN LABEL HADIAH
// ============================================================
function drawWheel(rotation = 0) {
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)

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
    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#f8f8f8"
    ctx.fill()
    ctx.strokeStyle = "#aaaaaaff"
    ctx.stroke()

    // Teks horizontal (menghadap kanan)
    ctx.save()
    const mid = (start + end) / 2
    ctx.rotate(mid)
    ctx.translate(radius * 0.71, 5)
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

  ctx.restore()
}

// ============================================================
// 6️⃣ LOGIKA SPIN & PENENTUAN PEMENANG
// ============================================================
spinBtn.addEventListener("click", () => {
  if (spinning) return
  spinning = true
  spinBtn.disabled = true
  resetBtn.disabled = true

  const segmentCount = allPrizes.length
  const segmentAngle = (Math.PI * 2) / segmentCount

  // Pilih pemenang acak
  const winnerIndex = randInt(segmentCount)
  const prize = allPrizes[winnerIndex]

  // Pilih peserta sesuai kategori hadiah
  const pool = participants.filter((p) => p.type === prize.type)
  const winnerParticipant = pool[randInt(pool.length)]

  // Hitung rotasi agar hadiah pemenang berhenti di kanan (jam 3)
  const segmentMidAngle = winnerIndex * segmentAngle + segmentAngle / 2
  const targetRotation = 0 - segmentMidAngle
  const extraRounds = 8 + randInt(4)
  const finalRotation = targetRotation + extraRounds * Math.PI * 2

  const duration = 9000
  const startTime = performance.now()

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  function animate(time) {
    const elapsed = time - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)
    const currentRotation = finalRotation * eased

    drawWheel(currentRotation)

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      spinning = false
      spinBtn.disabled = false
      resetBtn.disabled = false
      spinCount++
      spinCountEl.textContent = "Spins: " + spinCount

      // Hapus data yang sudah menang
      participants = participants.filter((p) => p.name !== winnerParticipant.name)
      allPrizes = allPrizes.filter((p) => p.name !== prize.name)

      // Simpan pemenang
      winners.push({ name: winnerParticipant.name, prize: prize.name })

      resultBox.innerHTML = `
        🎉 <strong>${winnerParticipant.name}</strong><br>
        Mendapatkan: <strong>${prize.name}</strong>
      `
      highlightParticipant(winnerParticipant.name)

      // tampilkan panel hadiah (kanan)
      showPrizePanel(winnerParticipant.name, prize)
    }
  }

  requestAnimationFrame(animate)
})

// ============================================================
// 7️⃣ HIGHLIGHT PEMENANG DI PANEL KIRI
// ============================================================
function highlightParticipant(name) {
  const nodes = participantsList.querySelectorAll(".participant")
  nodes.forEach((n) => {
    n.style.boxShadow = ""
    n.style.border = ""
    if (n.textContent.includes(name)) {
      n.style.border = "2px solid var(--accent)"
      n.style.background = "#c5ffc0ff"
      n.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  })
}

// === PANEL HADIAH (KANAN) ===
function showPrizePanel(winner, prize) {
  const prizeDisplay = document.getElementById("prizeDisplay")
  const prizeImage = document.getElementById("prizeImage")
  const prizeName = document.getElementById("prizeName")
  const winnerName = document.getElementById("winnerName")

  prizeName.textContent = prize.name
  winnerName.textContent = `🎉 ${winner}`
  prizeImage.src = prize.image || ""
  prizeDisplay.classList.remove("hidden")
}

// ============================================================
// 8️⃣ RESET
// ============================================================
resetBtn.addEventListener("click", () => {
  winners = []
  spinCount = 0
  spinCountEl.textContent = "Spins: 0"
  resultBox.textContent = "Hasil: -"
  generateParticipants()
  generatePrizes()
  renderParticipants()
  drawWheel(0)
})
