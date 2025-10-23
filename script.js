/* ============================================================
   🎯 SPIN ROULETTE DOORPRIZE — FINAL
   - LocalStorage agar data pemenang tidak hilang setelah refresh
   - Highlight hijau pemenang di panel kiri (sesuai screenshot)
   - Panel bawah menampilkan daftar pemenang (nama, hadiah, gambar)
   - Peserta tetap tampil di list, tapi sudah ditandai 'won' sehingga
     tidak bisa menang lagi (visual tetap muncul & highlight dipertahankan)
   ============================================================ */

// --- Variabel utama ---
let data = { employees: {}, nonEmployees: {} }
let participants = [] // semua peserta untuk tampilan (tidak dihapus saat menang)
let allPrizes = [] // hadiah yang tersisa untuk diundi
let spinning = false
let spinCount = 0
let winners = [] // histori pemenang

// === Ambil nilai spinCount dari localStorage (biar tidak reset saat refresh)
spinCount = parseInt(localStorage.getItem("doorprize_spinCount") || "0", 10)

// --- Elemen DOM ---
const wheelCanvas = document.getElementById("wheelCanvas")
const ctx = wheelCanvas.getContext("2d")
const spinBtn = document.getElementById("spinBtn")
const resetBtn = document.getElementById("resetBtn")
const resultBox = document.getElementById("resultBox")
const participantsList = document.getElementById("participantsList")
const spinCountEl = document.getElementById("spinCount")
const prizeDisplay = document.getElementById("prizeDisplay")
const prizeImage = document.getElementById("prizeImage")
const prizeName = document.getElementById("prizeName")
const winnerName = document.getElementById("winnerName")
const winnerPanel = document.querySelector(".winner-participant div")

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
// 1️⃣ MUAT DATA DARI JSON + LOCALSTORAGE
// ============================================================
fetch("data.json")
  .then((res) => res.json())
  .then((json) => {
    data = json

    // 🧩 Ambil urutan peserta acak (zig-zag)
    const savedOrder = localStorage.getItem("doorprize_participants_order")
    if (savedOrder) {
      participants = JSON.parse(savedOrder)
    } else {
      generateParticipants()
      localStorage.setItem("doorprize_participants_order", JSON.stringify(participants))
    }

    loadFromLocalStorage()
    generateParticipants() // buat objek peserta (dengan properti won)
    generatePrizes() // buat daftar hadiah (akan di-filter bila sudah dimenangkan)
    applyWinnerFilters() // tandai peserta yg sudah menang berdasarkan localStorage
    renderParticipants() // render daftar peserta (semua tetap tampil)
    drawWheel(0) // gambar roda awal
    renderWinnerList() // render daftar pemenang bawah

    spinCountEl.textContent = "Count: " + spinCount // tarik data counter sebelumnya
  })
  .catch((err) => console.error("Gagal memuat data.json:", err))

// ============================================================
// 🔁 FUNGSI UNTUK MENGACAK URUTAN ARRAY (FISHER-YATES SHUFFLE)
// ============================================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// ============================================================
// 2️⃣ GENERATE PESERTA & HADIAH
// participants: tetap berisi semua nama, tiap objek {name, type, won}
// ============================================================
function generateParticipants() {
  const emp = data.employees.names.map((n) => ({ name: n, type: "employee", won: false }))
  const non = data.nonEmployees.names.map((n) => ({ name: n, type: "nonEmployee", won: false }))

  // Gabungkan semua peserta
  participants = [...emp, ...non]

  // Acak urutan supaya warna tampil zig-zag (tidak berkelompok)
  // shuffleArray(participants)

  // Hanya acak sekali (saat tidak ada data tersimpan)
  if (!localStorage.getItem("doorprize_participants_order")) {
    shuffleArray(participants)
    localStorage.setItem("doorprize_participants_order", JSON.stringify(participants))
  } else {
    participants = JSON.parse(localStorage.getItem("doorprize_participants_order"))
  }

  // (Opsional) Simpan urutan agar tidak berubah saat refresh
  localStorage.setItem("doorprize_participants_order", JSON.stringify(participants))
}

function generatePrizes() {
  const empPrizes = data.employees.prizes.map((p) => ({ name: p.name, image: p.image, type: "employee" }))
  const nonPrizes = data.nonEmployees.prizes.map((p) => ({ name: p.name, image: p.image, type: "nonEmployee" }))
  allPrizes = [...empPrizes, ...nonPrizes]
}

// ============================================================
// 3️⃣ APPLY WINNER FILTERS (tandai peserta yang sudah menang)
// - jangan hapus peserta dari list agar highlight tetap terlihat
// - hanya hapus hadiah yang sudah dipakai (agar tidak diberikan dua kali)
// ============================================================
function applyWinnerFilters() {
  if (!winners || winners.length === 0) return
  // tandai peserta yang sudah menang
  const wonNames = winners.map((w) => w.name)
  participants.forEach((p) => {
    if (wonNames.includes(p.name)) p.won = true
  })
  // hapus hadiah yang sudah diberikan
  const wonPrizes = winners.map((w) => w.prize)
  allPrizes = allPrizes.filter((p) => !wonPrizes.includes(p.name))
}

// ============================================================
// 4️⃣ RENDER PESERTA (semua tetap tampil; pemenang diberi class .won)
// ============================================================
function renderParticipants() {
  participantsList.innerHTML = ""
  participants.forEach((p, i) => {
    const div = document.createElement("div")
    div.className = "participant " + (p.type === "employee" ? "emp" : "non")
    if (p.won) div.classList.add("won") // class tambahan jika sudah menang
    div.dataset.name = p.name
    // div.innerHTML = `<div>${i + 1}. ${p.name}</div><div>#${i + 1}</div>`
    div.innerHTML = `<div><b>${p.name}</b></div>`
    participantsList.appendChild(div)
  })

  // Pastikan highlight untuk pemenang lama tetap diterapkan (style inline)
  winners.forEach((w) => highlightParticipant(w.name))
}

// ============================================================
// 5️⃣ GAMBAR RODA
// ============================================================
function drawWheel(rotation = 0) {
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)

  const segmentCount = Math.max(1, allPrizes.length)
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
    ctx.strokeStyle = "#ddd"
    ctx.stroke()

    // label hadiah
    ctx.save()
    const mid = (start + end) / 2
    ctx.rotate(mid)
    ctx.translate(radius * 0.7, 5)
    ctx.font = "bold 20px Arial"
    ctx.fillStyle = "#333"
    ctx.textAlign = "center"
    const txt = allPrizes[i] ? allPrizes[i].name : ""
    // wrapText(ctx, txt, 0, 0, 120, 14)
    ctx.fillText(allPrizes[i].name, 0, 0)
    ctx.restore()
  }

  // lingkaran tengah
  ctx.beginPath()
  ctx.arc(0, 0, 40, 0, Math.PI * 2)
  ctx.fillStyle = "#fff"
  ctx.fill()
  ctx.strokeStyle = "#eee"
  ctx.stroke()

  ctx.restore()
}

// helper: wrap text untuk label agar tidak meluber
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ")
  let line = ""
  let lines = []
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim())
      line = words[n] + " "
    } else {
      line = testLine
    }
  }
  lines.push(line.trim())
  // render lines (centered)
  const totalH = lines.length * lineHeight
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y - totalH / 2 + i * lineHeight)
  }
}

// ============================================================
// 6️⃣ LOGIKA SPIN
// - pilih hadiah acak dari allPrizes
// - pilih peserta acak dari participants yang type cocok AND won === false
// ============================================================
spinBtn.addEventListener("click", () => {
  if (spinning || allPrizes.length === 0) return
  spinning = true
  spinBtn.disabled = true
  resetBtn.disabled = true

  const segmentCount = allPrizes.length
  const segmentAngle = (Math.PI * 2) / segmentCount

  // pilih index hadiah
  const winnerIndex = randInt(segmentCount)
  const prize = allPrizes[winnerIndex]

  // pool peserta yang eligible (type sama & belum menang)
  const pool = participants.filter((p) => p.type === prize.type && !p.won)
  if (pool.length === 0) {
    // tidak ada peserta eligible --> batalkan
    alert("Tidak ada peserta eligible untuk hadiah ini (semua sudah menang).")
    spinning = false
    spinBtn.disabled = false
    resetBtn.disabled = false
    return
  }
  const winnerParticipant = pool[randInt(pool.length)]

  // hitung rotasi supaya segmen hadiah berhenti di pointer kanan
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
      spinCountEl.textContent = "Count: " + spinCount
      localStorage.setItem("doorprize_spinCount", spinCount)

      handleWinner(winnerParticipant, prize)
    }
  }

  requestAnimationFrame(animate)
})

// ============================================================
// 7️⃣ HIGHLIGHT PEMENANG DI PANEL KIRI (TETAP DIPERTAHANKAN)
// ============================================================
// Perubahan: jangan mengosongkan style semua peserta agar highlight lama tetap bertahan.
// Style diatur supaya mirip screenshot: background hijau lembut + border tipis merah.
function highlightParticipant(name) {
  const nodes = participantsList.querySelectorAll(".participant")
  nodes.forEach((n) => {
    // jangan reset style supaya highlight lama tetap ada
    if (n.textContent.includes(name)) {
      // border hijau + latar hijau lembut (sesuai screenshot)
      n.style.border = "1.5px solid #48c628ff" // hijau
      n.style.background = "#c5ffc0" // hijau lembut (tanpa alpha)
      n.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  })
}

// ============================================================
// 8️⃣ TANGANI PEMENANG (tandai participant.won = true; hapus prize)
// ============================================================
function handleWinner(winnerParticipant, prize) {
  // tandai peserta sebagai sudah menang (tetap tampil di list)
  const partObj = participants.find((p) => p.name === winnerParticipant.name)
  if (partObj) partObj.won = true

  // hapus hadiah dari list hadiah agar tidak diundi lagi
  allPrizes = allPrizes.filter((p) => p.name !== prize.name)

  // simpan entry pemenang (nama, prize, image, type)
  const entry = {
    name: winnerParticipant.name,
    prize: prize.name,
    image: prize.image || "",
    type: winnerParticipant.type,
  }
  winners.push(entry)
  saveToLocalStorage()

  // tampilkan hasil & update UI
  resultBox.innerHTML = `🎉 <strong>${entry.name}</strong><br>Mendapatkan: <strong>${entry.prize}</strong>`
  highlightParticipant(entry.name)
  showPrizePanel(entry.name, prize)
  renderParticipants() // re-render agar class .won terpasang jika diperlukan
  renderWinnerList()
}

// ============================================================
// 9️⃣ PANEL HADIAH (KANAN)
// ============================================================
function showPrizePanel(winner, prize) {
  prizeName.textContent = prize.name
  winnerName.textContent = `🎉 ${winner}`
  prizeImage.src = prize.image || ""
  prizeDisplay.classList.remove("hidden")
}

// ============================================================
// 🔟 PANEL BAWAH — DAFTAR PEMENANG (nama, hadiah, gambar)
// ============================================================
function renderWinnerList() {
  winnerPanel.innerHTML = ""
  if (winners.length === 0) {
    winnerPanel.innerHTML = "<p>Belum ada pemenang.</p>"
    return
  }

  winners.forEach((w) => {
    const item = document.createElement("div")
    item.className = "winner-item"
    item.style.display = "flex"
    item.style.alignItems = "center"
    item.style.gap = "15px"
    item.style.borderBottom = "1px solid #eee"
    item.style.padding = "8px 0"

    const img = document.createElement("img")
    img.src = w.image || ""
    img.alt = w.prize
    img.style.width = "80px"
    img.style.height = "80px"
    img.style.borderRadius = "8px"
    img.style.objectFit = "cover"
    img.style.border = "1px solid #ddd"

    const text = document.createElement("div")
    text.innerHTML = `<div>Kupon No. <strong>${w.name}</strong><br>Hadiah: <strong>${w.prize}</strong></div>`

    item.appendChild(img)
    item.appendChild(text)
    winnerPanel.appendChild(item)
  })
}

// ============================================================
// 11️⃣ LOCALSTORAGE (simpanan pemenang)
// ============================================================
function saveToLocalStorage() {
  localStorage.setItem("doorprize_winners", JSON.stringify(winners))
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem("doorprize_winners")
  if (stored) {
    try {
      winners = JSON.parse(stored)
    } catch (e) {
      winners = []
    }
  } else {
    winners = []
  }
}

// ============================================================
// 12️⃣ RESET DATA (hapus localStorage & kembalikan kondisi awal)
// ============================================================
resetBtn.addEventListener("click", () => {
  const confirmReset = confirm(
    "⚠️ Apakah Anda yakin ingin mereset semua data? \nSemua pemenang dan hitungan spin akan dihapus."
  )
  if (!confirmReset) return // batal jika user tekan Cancel

  localStorage.removeItem("doorprize_winners")
  localStorage.removeItem("doorprize_spinCount") // Remove counter
  localStorage.removeItem("doorprize_participants_order")
  winners = []
  spinCount = 0
  spinCountEl.textContent = "Count: 0"
  resultBox.textContent = "Hasil: -"
  prizeDisplay.classList.add("hidden")
  generateParticipants()
  generatePrizes()
  // applyWinnerFilters akan mengabaikan karena winners = []
  renderParticipants()
  drawWheel(0)
  renderWinnerList()
})
