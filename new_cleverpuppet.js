const { isEmpty } = require("lodash");
const puppeteer = require("puppeteer");
const axios = require("axios").default;
const { convertLATime } = require("./utils");

var no_delay = false;
var target_courses = [6204];

const my_info = {
  test: {
    name: "eliert0327",
    passwd: "PICpic123!@#",
    url: "https://cityofla.ezlinksgolf.com/",
    cardID: "9304996",
    groupID: "20218",
  },
  real: {
    name: "la-134554",
    passwd: "hrx7xbe!epj.wkz3DBK",
    url: "https://cityoflapcp.ezlinksgolf.com/",
    cardID: "9293237",
    groupID: "20248",
  },
  real1: {
    name: "la-158582",
    passwd: "lacitygolf",
    url: "https://cityoflapcp.ezlinksgolf.com/",
    cardID: "9304026",
    groupID: "20248",
  },
  real2: {
    name: "la-171182",
    passwd: "Damnjina1234!",
    url: "https://cityoflapcp.ezlinksgolf.com/",
    cardID: "9620941",
    groupID: "20248",
  },
};

const medium_wait_time = 5000;
const retry_time = 1000;
const action_delay_time = 100;

// url
const serch_api_url = "/api/search/search";
const login_api_url = "/api/login/login";

const booking_info = my_info.test;
var csrftoken = "";
var sessionID = "";
var globalCookie = "";
var contactID = "";

async function reqReservation(course) {
  var reliable_header = {
    headers: { ...globalCookie },
  };

  const reservation_info = {
    p02: [
      {
        r01: course.r06,
        r02: course.r10,
        r03: course.r13,
        r04: course.r12,
        r05: 0,
        r06: course.r02,
        r07: course.r20,
      },
    ],
    p01: course.r01,
    p03: sessionID,
  };
  try {
    await axios
      .post(
        `${booking_info.url}/api/search/reservation`,
        reservation_info,
        reliable_header
      )
      .then(async (resp) => {
        const add_cart_req = {
          r01: course.r01,
          r02: resp.data.r02[0],
          r03: 4,
          r04: false,
          r05: contactID,
          r06: false,
          r07: sessionID,
          r08: resp.data.r02[0].r06,
          r09: csrftoken,
        };

        await axios
          .post(
            `${booking_info.url}/api/cart/add`,
            add_cart_req,
            reliable_header
          )
          .then(async (resp) => {
            if (!isEmpty(resp.data) && resp.data.IsSuccessful == true) {
              const link_req = {
                CardOnFileID: booking_info.cardID,
                SessionID: sessionID,
                SponsorID: course.r06,
                ContactID: contactID,
                CourseID: course.r07,
                MasterSponsorID: course.r06,
              };

              await axios
                .post(
                  `${booking_info.url}/api/card/link`,
                  link_req,
                  reliable_header
                )
                .then(async (resp) => {
                  const finish_req = {
                    ContinueOnPartnerTeeTimeConflict: true,
                    Email1: null,
                    Email2: null,
                    Email3: null,
                    SponsorID: course.r06,
                    CourseID: course.r07,
                    ReservationTypeID: course.r03,
                    SessionID: sessionID,
                    ContactID: contactID,
                    MasterSponsorID: course.r06,
                    GroupID: booking_info.groupID,
                  };

                  await axios
                    .post(
                      `${booking_info.url}/api/cart/finish`,
                      finish_req,
                      reliable_header
                    )
                    .then((resp) => {
                      if (!isEmpty(resp) && !isEmpty(resp.data)) {
                        const reservation = resp.data;
                        console.log(
                          reservation.Location,
                          reservation.ScheduledTime,
                          convertLATime(new Date())
                        );
                        process.exit(0);
                      }
                    })
                    .catch((e) => {
                      console.log(
                        "finish - ",
                        course.r16,
                        course.r24,
                        e.message
                      );
                      if (e.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        console.log(e.response.data);
                        console.log(e.response.status);
                        console.log(e.response.headers);
                      }
                    });
                })
                .catch((e) =>
                  console.log("card link - ", course.r16, course.r24, e.message)
                );
            } else {
              console.log("Not Successfully!");
            }
          })
          .catch((e) =>
            console.log("cart add - ", course.r16, course.r24, e.message)
          );
      })
      .catch((e) =>
        console.log("reserve - ", course.r16, course.r24, e.message)
      );
  } catch (e) {
    console.log("final - ", course.r16, course.r24, e.message);
  }
}

async function main() {
  try {
    //	  await wait(min_wait_time * 60);
    const reservedDate = getReserveDate();

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    const block_resource_type_list = ["image", "stylesheet", "font"];
    await page.setViewport({ width: 1200, height: 720 });

    page.setRequestInterception(true);
    page.on("request", async (interceptedRequest) => {
      try {
        const headers = interceptedRequest.headers();
        headers["user-agent"] = "PostmanRuntime/7.32.2";
        // decread load
        if (
          block_resource_type_list.includes(interceptedRequest.resourceType())
        ) {
          await interceptedRequest.abort();
          return;
        }

        if (interceptedRequest.url().includes(serch_api_url) > 0) {
          globalCookie = interceptedRequest.headers();
          var payload = {
            p01: target_courses, //
            p02: reservedDate,
            // p02: "06/11/2023",
            p03: "5:00 AM",
            p04: "7:00 PM",
            p05: 1,
            p06: 4,
            p07: false,
          };

          interceptedRequest.continue({
            ...headers,
            postData: JSON.stringify(payload),
          });
        } else {
          interceptedRequest.continue({ headers });
        }
      } catch (err) {
        console.log(err);
      }
    });

    page.on("response", async (response) => {
      const request = response.request();
      if (request.url().includes(serch_api_url)) {
        const text = await response.text();
        try {
          const courses = JSON.parse(text);

          if (!isEmpty(courses) && !isEmpty(courses.r06)) {
            console.log("Courses:", courses.r06.length);
            var array = shuffle(courses.r06).filter((item) =>
              item.r16.includes("Rancho")
            );
            for (let index = 0; index < array.length; index++) {
              var course = array[index];
              await reqReservation(course);
            }
            array = shuffle(courses.r06).filter(
              (item) => !item.r16.includes("Rancho")
            );
            for (let index = 0; index < array.length; index++) {
              var course = array[index];
              await reqReservation(course);
            }
          } else {
            var timeA = convertLATime(new Date());
            if (no_delay || (timeA >= "5:57:00" && timeA <= "6:10:00")) {
              if (timeA <= "5:57:00" || timeA >= "6:10:00") {
                console.log(timeA);
                await wait(medium_wait_time * 10);
              }
              await page.evaluate(() => {
                const tds = Array.from(
                  document.querySelectorAll("ul.dropdown-menu li a")
                );

                tds.map((td) => {
                  var txt = td.innerHTML;

                  if (txt == "18") {
                    td.click();
                  }
                });
              });
            }

            return;
          }
        } catch (e) {
          e;
        }
      }

      if (request.url().includes(login_api_url)) {
        const text = await response.text();
        const json = JSON.parse(text);
        csrftoken = json.CsrfToken;
        sessionID = json.SessionID;
        contactID = json.ContactID;
      }
    });

    console.log(reservedDate);

    do {
      var timeA = convertLATime(new Date());

      console.log(timeA);
      if (timeA >= "5:57:30" && timeA <= "6:00:00") {
        console.log("Go to Web Sites");
        break;
      } else {
        if (no_delay) break;
        console.log("Waiting for event at 6:00:00");
        await wait(1000 * 60);
      }
    } while (1);

    await page.goto(`${booking_info.url}/index.html#/login`, {
      waitUntil: "networkidle0",
      timeout: 0,
    }); // wait until page load

    while (1) {
      try {
        await page.type("input[type=text]", booking_info.name);
        await page.type("input[type=password]", booking_info.passwd);
        break;
      } catch (e) {
        await wait(action_delay_time);

        await page.evaluate(
          () => (document.querySelector("input[type=text]").value = "")
        );
        await page.evaluate(
          () => (document.querySelector("input[type=password]").value = "")
        );
      }
    }

    while (1) {
      try {
        // click and wait for navigation
        await Promise.all([
          page.click("button[type=submit]"),
          page.waitForNavigation({ waitUntil: "networkidle0" }),
        ]);
        break;
      } catch (e) {
        await wait(action_delay_time);
        console.log(e);
      }
    }

    do {
      var timeA = convertLATime(new Date());

      console.log(timeA);
      if (timeA >= "5:57:30" && timeA <= "6:05:00") {
        console.log("Go Go!");
        break;
      } else {
        if (no_delay) break;
        await wait(action_delay_time);
      }
    } while (1);

    while (1) {
      try {
        await Promise.all([
          page.click("button[type=submit]"),
          page.waitForNavigation({ waitUntil: "networkidle0" }),
        ]);
        break;
      } catch {
        await wait(action_delay_time);
      }
    }

    await wait(retry_time);
  } catch (err) {
    console.log(err);
    try {
      await browser.close();
      await wait(retry_time);
    } catch {}
    main();
  }
}

async function wait(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

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

function getReserveDate() {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();
  const thisWeekend = new Date(currentDate.setDate(currentDate.getDate() + 9));

  const year = thisWeekend.getFullYear();
  const month = (thisWeekend.getMonth() + 1).toString().padStart(2, "0");
  const day = thisWeekend.getDate().toString().padStart(2, "0");

  return `${month}/${day}/${year}`;
}

if (process.argv.length >= 3) {
  switch (parseInt(process.argv[2])) {
    case 1: // Rancho
      target_courses = [6204];
      break;
    case 2: // Willson
      target_courses = [5997];
      break;
    case 3: // Hard
      target_courses = [5998];
      break;
    case 0: // Recommended 3 places
      target_courses = [5997, 5998, 6204];
      break;
    default: // All
      target_courses = [
        5997, 5998, 5995, 23128, 5996, 17679, 6171, 6204, 23129, 6205, 6226,
        6264, 23131, 6263, 23130, 6380, 23132,
      ];

      break;
  }
}

if (process.argv.length >= 4) {
  console.log("No Delay");
  no_delay = true;
}

console.log("Target Courses:", target_courses);
main();
