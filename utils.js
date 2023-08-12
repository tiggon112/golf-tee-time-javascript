function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function getReserveDate(days) {
  const currentDate = new Date();
  const thisWeekend = new Date(
    currentDate.setDate(currentDate.getDate() + parseInt(days))
  );

  const year = thisWeekend.getFullYear();
  const month = (thisWeekend.getMonth() + 1).toString().padStart(2, "0");
  const day = thisWeekend.getDate().toString().padStart(2, "0");

  return `${month}/${day}/${year}`;
}

const convertTime12to24 = (time12h) => {
  const [time, modifier] = time12h.split(" ");

  let [hours, minutes, seconds] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }

  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}:${seconds}`;
};

const convertLATime = (date) => {
  return convertTime12to24(
    date.toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles",
    })
  );
};

async function wait(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

module.exports = { convertLATime, shuffle, getReserveDate, wait };
