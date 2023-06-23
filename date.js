const currentDate = new Date();
console.log(currentDate);
const currentDay = currentDate.getDay();
const daysUntilWeekend = currentDay >= 7 ? 7 - currentDay + 6 : 6 - currentDay;
const thisWeekend = new Date(
  currentDate.setDate(currentDate.getDate() + daysUntilWeekend + 7)
);

const year = thisWeekend.getFullYear();
const month = (thisWeekend.getMonth() + 1).toString().padStart(2, "0");
const day = thisWeekend.getDate().toString().padStart(2, "0");
const formattedDate = `${month}/${day}/${year}`;

console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

console.log(formattedDate);

async function main() {
  do {
    var timeA = convertTime12to24(
      new Date().toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
      })
    );
    console.log(timeA);
    if (timeA > "7:00" && timeA < "7:30") {
      break;
    }
    await wait(100);
  } while (1);
}

async function wait(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
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

main();
