require("dotenv").config();
const axios = require("axios");
const { isEmpty } = require("lodash");
const { convertLATime, shuffle, wait } = require("./utils");
const TelegramBot = require("node-telegram-bot-api");

const default_user_id = "eliert0327";
const default_user_pwd = "PICpic123!@#";
const default_user_card_id = "9304996";
const default_user_group_id = "20218";
const default_site_url = "https://cityofla.ezlinksgolf.com";
const default_telgram_channel_ids = "-1001627135402";
const default_booking_mode = process.env.BOOKING_MODE || "stealth";
const default_courses =
  "5997,5998,5995,23128,5996,17679,6171,6204,23129,6205,6226,6264,23131,6263,23130,6380,23132";
const default_booking_start_time = process.env.BOOKING_START_TIME || "5:00 AM";
const default_booking_end_time = process.env.BOOKING_END_TIME || "7:00 PM";
const default_booking_target_days = process.env.BOOKING_TARGET_DAY || "9";
const default_reserve_date = getReserveDate();

const target_courses = (process.env.BOOKING_COURSES || default_courses).split(
  ","
);
const no_delay = process.env.BOOKING_NO_DELAY ? true : false;
const booking_info = {
  user_id: process.env.BOOKING_USER_ID || default_user_id,
  user_pwd: process.env.BOOKING_USER_PWD || default_user_pwd,
  user_card_id: process.env.BOOKING_USER_CARD_ID || default_user_card_id,
  user_group_id: process.env.BOOKING_USER_GROUP_ID || default_user_group_id,
  site_url: process.env.BOOKING_SITE_URL ?? default_site_url,
  telgram_channel_ids: (
    process.env.TELEGRAM_CHANNEL_IDS || default_telgram_channel_ids
  ).split(","),
};

const url = "https://api.zenrows.com/v1/";
const apikey = process.env.ZENROW_API_KEY;
const cookieIDs = ["AuthorizationCode", "ContactID"];

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

const startBot = async () => {
  const twirlTimer =
    !no_delay &&
    (function () {
      const P = ["\\", "|", "/", "-"];
      let x = 0;
      return setInterval(function () {
        process.stdout.write("\r" + P[x++] + " Please Wait util 5:57:30");
        x &= 3;
      }, 150);
    })();
  while (1) {
    const timeA = convertLATime(new Date());
    if (no_delay || (timeA >= "5:57:30" && timeA <= "6:00:00")) {
      clearInterval(twirlTimer);
      console.log("\n");
      await login();
    }
    if (timeA <= "5:57:30" || timeA >= "6:00:00") {
      await wait(2000);
    }
  }
};

const login = async () => {
  console.log("Please wait! I'm logging in");
  try {
    console.log(url, booking_info.site_url, apikey);
    const { data, headers } = await axios({
      url,
      method: "POST",
      data: `Login=${booking_info.user_id}&MasterSponsorID=13358&Password=${booking_info.user_pwd}&SessionID=`,
      params: {
        url: `${booking_info.site_url}/api/login/login`,
        apikey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
      },
    });
    console.log("Login succeed");

    const twirlTimer = (function () {
      const P = ["\\", "|", "/", "-"];
      let x = 0;
      return (
        no_delay &&
        setInterval(function () {
          process.stdout.write("\r" + P[x++] + " Please Wait util 5:59:59");
          x &= 3;
        }, 150)
      );
    })();
    do {
      const timeA = convertLATime(new Date());

      if (no_delay || (timeA >= "5:59:59" && timeA <= "6:05:00")) {
        clearInterval(twirlTimer);
        console.log("\nHere we go!");
        break;
      } else {
        await wait(1000);
      }
    } while (1);
    let i = 0;
    while (1) {
      i++;
      console.log("search count:", i);
      await startBooking({ data, headers });
    }
  } catch (err) {
    if ((err?.response?.data?.code ?? "") === "REQS003") {
      console.log("Token is expired!");
      process.exit(0);
    } else {
      console.log({
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });
      console.log("login failed. Retrying to login");
      return "retry";
    }
  }
};

const startBooking = async ({ data, headers }) => {
  try {
    const SessionID = data.SessionID;
    const CsrfToken = data.CsrfToken;
    const ContactID = data.ContactID;
    const Cookie = cookieIDs.reduce(
      (total, cur) => `${total}; ${cur}=${data[cur]}`,
      headers["zr-cookies"]
    );

    const body = target_courses.reduceRight((total, cur, inx) => {
      return `p01[${inx}]=${cur}&${total}`;
    }, `p02=${default_reserve_date}&p03=${default_booking_start_time}&p04=${default_booking_end_time}&p05=1&p06=4&p07=false`);
    const { data: searchData } = await axios({
      url,
      method: "POST",
      headers: { Cookie },
      data: body,
      params: {
        url: `${booking_info.site_url}/api/search/search`,
        apikey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
        custom_headers: "true",
      },
    });

    const courses = searchData["r06"];
    if (!courses.length) {
      console.log("No search results!");
      return;
    }
    console.log("Search success: " + courses.length + " results detected");

    const ranchoArray = [];
    const otherArray = [];
    shuffle(courses).forEach((item) => {
      if (item.r16.includes("Rancho")) {
        ranchoArray.push(item);
      } else {
        otherArray.push(item);
      }
    });
    for (let course of ranchoArray) {
      await reqReservation(course, Cookie, SessionID, ContactID, CsrfToken);
    }
    for (let course of otherArray) {
      await reqReservation(course, Cookie, SessionID, ContactID, CsrfToken);
    }
  } catch (err) {
    if ((err?.response?.data?.code ?? "") == "REQS003") {
      console.log("Token is expired!");
      process.exit(0);
    } else {
      console.log({
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });
      return "retry";
    }
  }
};

const reqReservation = async (
  course,
  Cookie,
  SessionID,
  ContactID,
  CsrfToken
) => {
  try {
    console.log("Reservation start: ", course.r16);
    const { data: reservationData } = await axios({
      url,
      method: "POST",
      headers: { Cookie },
      data: `p02[0].r01=${course.r06}&p02[0].r02=${course.r10}&p02[0].r03=${course.r13}&p02[0].r04=${course.r12}&p02[0].r05=0&p02[0].r06=${course.r02}&p02[0].r07=${course.r20}&p01=${course.r01}&p03=${SessionID}`,
      params: {
        url: `${booking_info.site_url}/api/search/reservation`,
        apikey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
        custom_headers: "true",
      },
    });
    console.log("Opening reservation success");

    console.log("Start cart adding");
    const { data: cartAddData } = await axios({
      url,
      method: "POST",
      headers: { Cookie },
      data: `r01=${course.r01}&r02=${reservationData.r02[0]}&r03=4&r04=false&r05=${ContactID}&r06=false&r07=${SessionID}&r08=${reservationData.r02[0].r06}&r09=${CsrfToken}`,
      params: {
        url: `${booking_info.site_url}/api/cart/add`,
        apikey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
        custom_headers: "true",
      },
    });
    console.log("Cart add success");

    if (!isEmpty(cartAddData) && cartAddData.IsSuccessful == true) {
      if (default_booking_mode == "stealth") {
        // stealth mode
        if (cartAddData.TeeTimeConflict == true) {
          console.log("Already booked");
          process.exit(0);
        }
      }

      await axios({
        url,
        method: "POST",
        headers: { Cookie },
        data: `CardOnFileID=${booking_info.user_card_id}&SessionID=${SessionID}&SponsorID=${course.r06}&ContactID=${ContactID}&CourseID=${course.r07}&MasterSponsorID=${course.r06}`,
        params: {
          url: `${booking_info.site_url}/api/card/link`,
          apikey,
          js_render: "true",
          antibot: "true",
          premium_proxy: "true",
          original_status: "true",
          device: "desktop",
          custom_headers: "true",
        },
      });
      console.log("card link data success");

      const { data: cartFinishData } = await axios({
        url,
        method: "POST",
        headers: { Cookie },
        data: `ContinueOnPartnerTeeTimeConflict=true&Email1=null&Email2=null&Email3=null&SponsorID=${course.r06}&CourseID=${course.r07}&ReservationTypeID=${course.r03}&SessionID=${SessionID}&ContactID=${ContactID}&MasterSponsorID=${course.r06}&GroupID=${booking_info.user_group_id}`,
        params: {
          url: `${booking_info.site_url}/api/cart/finish`,
          apikey,
          js_render: "true",
          antibot: "true",
          premium_proxy: "true",
          original_status: "true",
          device: "desktop",
          custom_headers: "true",
        },
      });
      console.log("Cart finish success");

      if (!isEmpty(cartFinishData)) {
        const reservation = cartFinishData;
        msg = "Card ID : " + booking_info.user_id + "\n";
        msg += "Location : " + reservation.Location + "\n";
        msg += "ScheduledTime : " + reservation.ScheduledTime + "\n";
        msg += "Booked Time : " + convertLATime(new Date());

        for (
          let index = 0;
          index < booking_info.telgram_channel_ids.length;
          index++
        ) {
          try {
            await bot.sendMessage(booking_info.telgram_channel_ids[index], msg);
          } catch (e) {
            console.log(e);
          }
        }
        console.log(msg);
        process.exit(0);
      }
    } else {
      console.log("Failed");
    }
  } catch (err) {
    if ((err?.response?.data?.code ?? "") == "REQS003") {
      console.log("Token is expired!");
      process.exit(0);
    } else {
      console.log({
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });
      return "next reservation";
    }
  }
};

startBot();

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
