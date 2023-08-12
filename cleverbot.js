const axios = require("axios");
const { isEmpty } = require("lodash");
const { convertLATime, getReserveDate, shuffle } = require("./utils");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

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
const default_reserve_date = getReserveDate(default_booking_target_days);
const default_booking_mode = process.env.BOOKING_MODE || "stealth";
const default_zenrow_api_token = process.env.ZENROWS_API_TOKEN || "";

booking_info = {};

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

const delay_wait_time = 5000;
const short_wait_time = 5000;

console.log(target_courses);
console.log(no_delay);
console.log(booking_info);
console.log(default_booking_start_time);
console.log(default_booking_end_time);
console.log(default_reserve_date);
console.log(default_booking_mode);

const ZenRowsUrl = "https://api.zenrows.com/v1/";
const ZenRowApiKey = default_zenrow_api_token;
const cookieIDs = ["AuthorizationCode", "ContactID"];

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

async function wait(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

const handleReservation = async (course, Cookie, SessionID, CsrfToken, ContactID) => {
  const { data: reservationData } = await axios({
    url: ZenRowsUrl,
    method: "POST",
    headers: { Cookie },
    data: `p02[0].r01=${course.r06}&p02[0].r02=${course.r10}&p02[0].r03=${course.r13}&p02[0].r04=${course.r12}&p02[0].r05=0&p02[0].r06=${course.r02}&p02[0].r07=${course.r20}&p01=${course.r01}&p03=${SessionID}`,
    params: {
      url: `${default_site_url}/api/search/reservation`,
      apikey: ZenRowApiKey,
      js_render: "true",
      antibot: "true",
      premium_proxy: "true",
      original_status: "true",
      device: "desktop",
      custom_headers: "true",
    },
  });
  console.log("reservation success");

  const { data: cartAddData } = await axios({
    url: ZenRowsUrl,
    method: "POST",
    headers: { Cookie },
    data: `r01=${course.r01}&r02=${reservationData.r02[0]}&r03=4&r04=false&r05=${ContactID}&r06=false&r07=${SessionID}&r08=${reservationData.r02[0].r06}&r09=${CsrfToken}`,
    params: {
      url: `${default_site_url}/api/cart/add`,
      apikey: ZenRowApiKey,
      js_render: "true",
      antibot: "true",
      premium_proxy: "true",
      original_status: "true",
      device: "desktop",
      custom_headers: "true",
    },
  });
  console.log("cart add success");

  if (!isEmpty(cartAddData) && cartAddData.IsSuccessful == true) {
    if (default_booking_mode == "stealth") {
      // stealth mode
      if (cartAddData.TeeTimeConflict == true) {
        console.log("Already booked");
        process.exit(0);
      }
    }

    await axios({
      url: ZenRowsUrl,
      method: "POST",
      headers: { Cookie },
      data: `CardOnFileID=${booking_info.user_card_id}&SessionID=${SessionID}&SponsorID=${course.r06}&ContactID=${ContactID}&CourseID=${course.r07}&MasterSponsorID=${course.r06}`,
      params: {
        url: `${default_site_url}/api/card/link`,
        apikey: ZenRowApiKey,
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
      url: ZenRowsUrl,
      method: "POST",
      headers: { Cookie },
      data: `ContinueOnPartnerTeeTimeConflict=true&Email1=null&Email2=null&Email3=null&SponsorID=${course.r06}&CourseID=${course.r07}&ReservationTypeID=${course.r03}&SessionID=${SessionID}&ContactID=${ContactID}&MasterSponsorID=${course.r06}&GroupID=${booking_info.user_group_id}`,
      params: {
        url: `${default_site_url}/api/cart/finish`,
        apikey: ZenRowApiKey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
        custom_headers: "true",
      },
    });
    console.log("cart finish success");

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
          await bot
            .sendMessage(booking_info.telgram_channel_ids[index], msg)
            .catch((error) => {
              console.log(error); // => 'ETELEGRAM'
            });
        } catch (e) {
          console.log(e);
        }
      }
      console.log(msg);
      process.exit(0);
    }
  } else {
    console.log("Failed");
    return;
  }
}


const startBot = async () => {
  while (1) {
    try {
      var timeA = convertLATime(new Date());
      if (!no_delay && (timeA <= "5:58:00" || timeA >= "6:10:00")) {
        console.log(timeA);
        await wait(delay_wait_time * 10);
        continue;
      }

      const { data, headers } = await axios({
        url: ZenRowsUrl,
        method: "POST",
        data: `Login=${booking_info.user_id}&MasterSponsorID=13358&Password=${booking_info.user_pwd}&SessionID=`,
        params: {
          url: `${default_site_url}/api/login/login`,
          apikey: ZenRowApiKey,
          js_render: "true",
          antibot: "true",
          premium_proxy: "true",
          original_status: "true",
          device: "desktop",
        },
      });

      if (no_delay || timeA >= "6:00:00") {
        console.log(data);

        if (!isEmpty(data))
          await startBooking({ data, headers });
      } else {
        console.log("Not yet, please wait for ...");
        await wait(short_wait_time * 10);
        continue;
      }
    } catch (e) {
      console.log(e.message)
      console.log(e.response?.data)
      console.log("Retry to login...");
      await wait(delay_wait_time * 10);
    }
  }
};

const startBooking = async ({ data, headers }) => {
  const SessionID = data.SessionID;
  const CsrfToken = data.CsrfToken;
  const ContactID = data.ContactID;
  const Cookie = cookieIDs.reduce(
    (total, cur) => `${total}; ${cur}=${data[cur]}`,
    headers["zr-cookies"]
  );
  console.log("Successfully set Cookie");

  var searchQuery = "";

  searchQuery = `p02=${default_reserve_date}&`
  searchQuery += `p03=${default_booking_start_time}&`
  searchQuery += `p04=${default_booking_end_time}&`
  searchQuery += `p05=1&p06=4&p07=false`

  target_courses.map((course, index) => {
    searchQuery += `&p01[${index}]=${course}`
  })

  console.log("Course Search Query:", searchQuery);

  while (1) {
    try {
      const { data: searchData } = await axios({
        url: ZenRowsUrl,
        method: "POST",
        headers: { Cookie },
        data: searchQuery,
        params: {
          url: `${default_site_url}/api/search/search`,
          apikey: ZenRowApiKey,
          js_render: "true",
          antibot: "true",
          premium_proxy: "true",
          original_status: "true",
          device: "desktop",
          custom_headers: "true",
        },
      });
      console.log("search success");
      if (isEmpty(searchData)) {
        console.log("Empty Search Data. Retry...");
        continue;
      }
      var courses = searchData["r06"]
      if (isEmpty(courses)) {
        console.log("Empty Course. Retry...");
        continue;
      }
      console.log("Courses : ", courses.length);

      var array = shuffle(courses).filter((item) =>
        item.r16.includes("Rancho")
      );
      for (let index = 0; index < array.length; index++) {
        var course = array[index];
        try {
          await handleReservation(course, Cookie, SessionID, CsrfToken, ContactID);
        } catch (e) {
          console.log(e.message)
          console.log(e.response?.data)
          if (e.response?.data?.code === "REQS003") {
            console.log("Token is expired!");
            process.exit(0);
          }
        }

      }
      array = shuffle(courses).filter(
        (item) => !item.r16.includes("Rancho")
      );
      for (let index = 0; index < array.length; index++) {
        var course = array[index];
        try {
          await handleReservation(course, Cookie, SessionID, CsrfToken, ContactID);
        } catch (e) {
          console.log(e.message)
          console.log(e.response?.data)
          if (e.response?.data?.code === "REQS003") {
            console.log("Token is expired!");
            process.exit(0);
          }
        }
      }
    } catch (err) {
      console.log(err.message)
      console.log(err.response?.data)
      if (err.response?.data?.code === "REQS003") {
        console.log("Token is expired!");
        process.exit(0);
      }
    }
  }
};

startBot();
