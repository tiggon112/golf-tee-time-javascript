const { isEmpty } = require("lodash");
const puppeteer = require("puppeteer-extra");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const { executablePath } = require("puppeteer");

const axios = require("axios").default;
const { convertLATime } = require("./utils");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: false });

var no_delay = false;
var target_courses = [6204];

const medium_wait_time = 5000;
const retry_time = 1000;
const action_delay_time = 100;

// url
const serch_api_url = "/api/search/search";
const login_api_url = "/api/login/login";

// 6204 for Rancho, 5997 for Willson, 5998 for Hard
const default_courses =
  "5997,5998,5995,23128,5996,17679,6171,6204,23129,6205,6226,6264,23131,6263,23130,6380,23132";
const default_user_id = "eliert0327";
const default_user_pwd = "PICpic123!@#";
const default_user_card_id = "9304996";
const default_user_group_id = "20218";
const default_site_url = "https://cityofla.ezlinksgolf.com/";
const default_telgram_channel_ids = "-1001627135402";
const default_booking_start_time = process.env.BOOKING_START_TIME || "5:00 AM";
const default_booking_end_time = process.env.BOOKING_END_TIME || "7:00 PM";
const default_booking_target_days = process.env.BOOKING_TARGET_DAY || "9";
const default_reserve_date = getReserveDate();
const default_booking_holes = process.env.BOOKING_HOLES || "18";
const default_booking_mode = process.env.BOOKING_MODE || "stealth";

booking_info = {};
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
        `${booking_info.site_url}/api/search/reservation`,
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
            `${booking_info.site_url}/api/cart/add`,
            add_cart_req,
            reliable_header
          )
          .then(async (resp) => {
            if (!isEmpty(resp.data) && resp.data.IsSuccessful == true) {
              if (default_booking_mode == "stealth") {
                // stealth mode
                if (resp.data.TeeTimeConflict == true) {
                  console.log("Already booked");
                  process.exit(0);
                }
              }

              const link_req = {
                CardOnFileID: booking_info.user_card_id,
                SessionID: sessionID,
                SponsorID: course.r06,
                ContactID: contactID,
                CourseID: course.r07,
                MasterSponsorID: course.r06,
              };

              await axios
                .post(
                  `${booking_info.site_url}/api/card/link`,
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
                    GroupID: booking_info.user_group_id,
                  };

                  await axios
                    .post(
                      `${booking_info.site_url}/api/cart/finish`,
                      finish_req,
                      reliable_header
                    )
                    .then(async (resp) => {
                      if (!isEmpty(resp) && !isEmpty(resp.data)) {
                        const reservation = resp.data;
                        msg = "Card ID : " + booking_info.user_id + "\n";
                        msg += "Location : " + reservation.Location + "\n";
                        msg +=
                          "ScheduledTime : " + reservation.ScheduledTime + "\n";
                        msg += "Booked Time : " + convertLATime(new Date());

                        for (
                          let index = 0;
                          index < booking_info.telgram_channel_ids.length;
                          index++
                        ) {
                          try {
                            await bot
                              .sendMessage(
                                booking_info.telgram_channel_ids[index],
                                msg
                              )
                              .catch((error) => {
                                console.log(error.code); // => 'ETELEGRAM'
                                console.log(error.response.body); // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
                              });
                          } catch (e) {
                            console.log(e);
                          }
                        }
                        console.log(msg);
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
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: executablePath(),
    });
    const page = await browser.newPage();
    const block_resource_type_list = ["image", "stylesheet", "font"];
    await page.setViewport({ width: 1200, height: 720 });

    page.setRequestInterception(true);
    page.on("request", async (interceptedRequest) => {
      try {
        const headers = interceptedRequest.headers();
        // headers["user-agent"] = "PostmanRuntime/7.32.2";
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
            p02: default_reserve_date,
            // p02: "06/11/2023",
            p03: default_booking_start_time,
            p04: default_booking_end_time,
            p05: default_booking_holes == "18" ? 1 : 2,
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
              await page.evaluate((holes) => {
                const tds = Array.from(
                  document.querySelectorAll("ul.dropdown-menu li a")
                );

                tds.map((td) => {
                  var txt = td.innerHTML;

                  if (txt == holes) {
                    td.click();
                  }
                });
              }, default_booking_holes);
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

    await page.goto(`${booking_info.site_url}/index.html#/login`, {
      waitUntil: "networkidle0",
      timeout: 0,
    }); // wait until page load

    await page.waitForTimeout(5000);
    while (1) {
      try {
        frame = await page
          .frames()
          .find((f) => f.url().includes("challenges.cloudflare.com"));

        const element = await frame.$("input[type=checkbox]");

        await page.waitForTimeout(2000);
        //Click the element
        await element.click();
        await page.waitForTimeout(5000);
        break;
      } catch (e) {
        console.log(e);
      }
    }

    while (1) {
      try {
        await page.type("input[type=text]", booking_info.user_id);
        await page.type("input[type=password]", booking_info.user_pwd);
        break;
      } catch (e) {
        await wait(action_delay_time);
        try {
          await page.evaluate(
            () => (document.querySelector("input[type=text]").value = "")
          );
          await page.evaluate(
            () => (document.querySelector("input[type=password]").value = "")
          );
        } catch (err) {
          await wait(action_delay_time);
        }
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
  const thisWeekend = new Date(
    currentDate.setDate(
      currentDate.getDate() + parseInt(default_booking_target_days)
    )
  );

  const year = thisWeekend.getFullYear();
  const month = (thisWeekend.getMonth() + 1).toString().padStart(2, "0");
  const day = thisWeekend.getDate().toString().padStart(2, "0");

  return `${month}/${day}/${year}`;
}

target_courses = (process.env.BOOKING_COURSES || default_courses).split(",");
no_delay = process.env.BOOKING_NO_DELAY ? true : false;
booking_info.user_id = process.env.BOOKING_USER_ID || default_user_id;
booking_info.user_pwd = process.env.BOOKING_USER_PWD || default_user_pwd;
booking_info.user_card_id =
  process.env.BOOKING_USER_CARD_ID || default_user_card_id;
booking_info.user_group_id =
  process.env.BOOKING_USER_GROUP_ID || default_user_group_id;
booking_info.site_url = process.env.BOOKING_SITE_URL || default_site_url;
booking_info.telgram_channel_ids = (
  process.env.TELEGRAM_CHANNEL_IDS || default_telgram_channel_ids
).split(",");

console.log(target_courses);
console.log(no_delay);
console.log(booking_info);
console.log(default_booking_start_time);
console.log(default_booking_end_time);
console.log(default_reserve_date);
console.log(default_booking_mode);

main();
