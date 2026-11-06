const floors = [
  {
    id: 0,
    name: "Lockers floor",
    rooms: [
      { id: "101", name: "101", type: "Classroom", capacity: 30, equipment: "Projector", x: 5, y: 7, width: 19, height: 34, schedule: [{ start: "08:00", end: "08:45", subject: "Mathematics", className: "1.A", teacher: "Novak" }, { start: "09:00", end: "09:45", subject: "Physics", className: "2.B", teacher: "Dvorak" }] },
      { id: "102", name: "102", type: "IT room", capacity: 16, equipment: "Projector, 16 computers", x: 27, y: 7, width: 19, height: 34, schedule: [{ start: "08:00", end: "08:45", subject: "Programming", className: "3.C", teacher: "Svoboda" }, { start: "10:00", end: "10:45", subject: "Databases", className: "4.A", teacher: "Kral" }] },
      { id: "103", name: "103", type: "Classroom", capacity: 28, equipment: "Projector", x: 54, y: 7, width: 19, height: 34, schedule: [{ start: "09:00", end: "09:45", subject: "English", className: "1.B", teacher: "Smith" }] },
      { id: "104", name: "104", type: "Classroom", capacity: 28, equipment: "Projector", x: 76, y: 7, width: 19, height: 34, schedule: [] },
      { id: "105", name: "105", type: "Unavailable", capacity: 0, equipment: "Projector, maintenance", x: 5, y: 63, width: 19, height: 28, unavailable: true, schedule: [] },
      { id: "106", name: "106", type: "Classroom", capacity: 30, equipment: "Projector", x: 27, y: 63, width: 19, height: 28, schedule: [{ start: "11:00", end: "11:45", subject: "Chemistry", className: "2.A", teacher: "Horak" }] },
      { id: "107", name: "107", type: "Classroom", capacity: 26, equipment: "Projector", x: 54, y: 63, width: 19, height: 28, schedule: [] },
      { id: "108", name: "108", type: "IT room", capacity: 16, equipment: "Projector, 16 computers", x: 76, y: 63, width: 19, height: 28, schedule: [{ start: "08:00", end: "08:45", subject: "History", className: "3.A", teacher: "Prochazka" }] }
    ]
  },
  {
    id: 1,
    name: "First floor",
    rooms: createRooms(201, 208)
  },
  {
    id: 2,
    name: "Second floor",
    rooms: createRooms(301, 308)
  },
  {
    id: 3,
    name: "Third floor",
    rooms: createRooms(401, 408)
  },
  {
    id: 4,
    name: "Fourth floor",
    rooms: createRooms(501, 508)
  }
];

function createRooms(firstRoom, lastRoom) {
  return Array.from({ length: lastRoom - firstRoom + 1 }, (_, index) => {
    const roomNumber = String(firstRoom + index);
    const hasLesson = index % 3 !== 2;

    return {
      id: roomNumber,
      name: roomNumber,
      type: index === 1 ? "IT room" : "Classroom",
      capacity: index === 1 ? 16 : 30,
      equipment: index === 1 ? "Projector, 16 computers" : "Projector",
      x: index % 4 < 2 ? 5 + (index % 2) * 22 : 54 + ((index - 2) % 2) * 22,
      y: index < 4 ? 7 : 63,
      width: 19,
      height: 28,
      schedule: hasLesson ? [{ start: "08:00", end: "08:45", subject: "Example lesson", className: "2.A", teacher: "Example teacher" }] : []
    };
  });
}

const state = {
  selectedFloor: 0,
  selectedRoom: null,
  search: ""
};

const elements = {
  floorTabs: document.querySelector("#floor-tabs"),
  floorTitle: document.querySelector("#floor-title"),
  floorMap: document.querySelector("#floor-map"),
  mapSummary: document.querySelector("#map-summary"),
  roomDetails: document.querySelector("#room-details"),
  search: document.querySelector("#room-search"),
  currentDate: document.querySelector("#current-date"),
  currentTime: document.querySelector("#current-time")
};

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getRoomStatus(room, now = new Date()) {
  if (room.unavailable) {
    return "unavailable";
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return room.schedule.some((lesson) => (
    currentMinutes >= timeToMinutes(lesson.start) &&
    currentMinutes < timeToMinutes(lesson.end)
  )) ? "occupied" : "free";
}

function getCurrentLesson(room, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return room.schedule.find((lesson) => (
    currentMinutes >= timeToMinutes(lesson.start) &&
    currentMinutes < timeToMinutes(lesson.end)
  ));
}

function getNextLesson(room, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return room.schedule.find((lesson) => timeToMinutes(lesson.start) > currentMinutes);
}

function renderFloorTabs() {
  elements.floorTabs.innerHTML = floors.map((floor) => `
    <button class="floor-tab ${floor.id === state.selectedFloor ? "active" : ""}"
      type="button" role="tab" aria-selected="${floor.id === state.selectedFloor}" data-floor="${floor.id}">
      ${floor.name}
    </button>
  `).join("");

  elements.floorTabs.querySelectorAll("[data-floor]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedFloor = Number(button.dataset.floor);
      state.selectedRoom = null;
      render();
    });
  });
}

function renderMap() {
  const floor = floors[state.selectedFloor];
  const rooms = floor.rooms.filter((room) => room.name.toLowerCase().includes(state.search.toLowerCase()));
  const now = new Date();
  const occupied = floor.rooms.filter((room) => getRoomStatus(room, now) === "occupied").length;
  const free = floor.rooms.filter((room) => getRoomStatus(room, now) === "free").length;

  elements.floorTitle.textContent = floor.name;
  elements.mapSummary.textContent = `${free} free · ${occupied} occupied · ${floor.rooms.length} rooms`;
  elements.floorMap.innerHTML = `
    <div class="map-wall horizontal" aria-hidden="true"></div>
    <div class="map-wall vertical" aria-hidden="true"></div>
    ${rooms.map((room) => {
      const status = getRoomStatus(room, now);
      const currentLesson = getCurrentLesson(room, now);
      const scheduleText = room.schedule.length
        ? room.schedule.map((lesson) => `${lesson.start}–${lesson.end} ${lesson.subject}`).join("<br>")
        : "No lesson scheduled";
      return `
        <button class="room ${status} ${state.selectedRoom === room.id ? "selected" : ""}"
          type="button" data-room="${room.id}" aria-label="Room ${room.name}, ${status}"
          style="left:${room.x}%;top:${room.y}%;width:${room.width}%;height:${room.height}%">
          <span class="room-label">${room.name}</span>
          <span class="room-status">${scheduleText}</span>
        </button>
      `;
    }).join("")}
  `;

  elements.floorMap.querySelectorAll("[data-room]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRoom = button.dataset.room;
      render();
    });
  });
}

function renderDetails() {
  const room = floors[state.selectedFloor].rooms.find((item) => item.id === state.selectedRoom);
  if (!room) {
    elements.roomDetails.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">?</span>
        <h2>Select a classroom</h2>
        <p>Click a room on the map to see its schedule and availability.</p>
      </div>
    `;
    return;
  }

  const status = getRoomStatus(room);
  const currentLesson = getCurrentLesson(room);
  const nextLesson = getNextLesson(room);
  const statusLabel = { free: "Free", occupied: "Occupied", unavailable: "Unavailable" }[status];

  elements.roomDetails.innerHTML = `
    <div class="room-header">
      <div>
        <p class="eyebrow">Selected room</p>
        <h2>Room ${room.name}</h2>
      </div>
      <span class="status-badge ${status}">${statusLabel}</span>
    </div>
    <dl class="detail-list">
      <div><dt>Type</dt><dd>${room.type}</dd></div>
      <div><dt>Capacity</dt><dd>${room.capacity || "—"}</dd></div>
      <div><dt>Equipment</dt><dd>${room.equipment}</dd></div>
      <div><dt>Current status</dt><dd>${status === "occupied" && currentLesson ? `${currentLesson.start}–${currentLesson.end}` : "No scheduled lesson"}</dd></div>
    </dl>
    <h3 class="schedule-title">Today's schedule</h3>
    ${room.schedule.length ? room.schedule.map((lesson) => `
      <div class="schedule-item">
        <span class="schedule-time">${lesson.start}–${lesson.end}</span>
        <div>
          <div class="schedule-subject">${lesson.subject}</div>
          <div class="schedule-meta">${lesson.className} · ${lesson.teacher}</div>
        </div>
      </div>
    `).join("") : "<p class=\"schedule-meta\">No lessons scheduled for this room today.</p>"}
    ${nextLesson ? `<p class="schedule-meta">Next lesson: <strong>${nextLesson.subject}</strong> at ${nextLesson.start}.</p>` : ""}
  `;
}

function updateClock() {
  const now = new Date();
  elements.currentDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  elements.currentTime.textContent = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function render() {
  renderFloorTabs();
  renderMap();
  renderDetails();
}

elements.search.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderMap();
});

updateClock();
setInterval(() => {
  updateClock();
  renderMap();
  renderDetails();
}, 30000);
render();
