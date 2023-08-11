const axios = require("axios");
const { isEmpty } = require("lodash");
const { convertLATime } = require("./utils");
const TelegramBot = require("node-telegram-bot-api");

const default_user_id = "eliert0327";
const default_user_pwd = "PICpic123!@#";
const default_user_card_id = "9304996";
const default_user_group_id = "20218";
const default_site_url = "https://cityofla.ezlinksgolf.com/";
const default_telgram_channel_ids = "-1001627135402";
const default_booking_mode = process.env.BOOKING_MODE || "stealth";

const booking_info = {
  user_id: process.env.BOOKING_USER_ID || default_user_id,
  user_pwd: process.env.BOOKING_USER_PWD || default_user_pwd,
  user_card_id: process.env.BOOKING_USER_CARD_ID || default_user_card_id,
  user_group_id: process.env.BOOKING_USER_GROUP_ID || default_user_group_id,
  site_url: process.env.BOOKING_SITE_URL || default_site_url,
  telgram_channel_ids: (
    process.env.TELEGRAM_CHANNEL_IDS || default_telgram_channel_ids
  ).split(","),
};

const url = "https://api.zenrows.com/v1/";
const apikey = "143840c50c633c2bc18287a31900eaecbe788a3a";
const cookieIDs = ["AuthorizationCode", "ContactID"];

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

const startBooking = async () => {
  try {
    const { data, headers } = await axios({
      url,
      method: "POST",
      data: "Login=eliert0327&MasterSponsorID=13358&Password=PICpic123!@#&SessionID=",
      params: {
        url: "https://cityofla.ezlinksgolf.com/api/login/login",
        apikey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
      },
    });
    console.log("login success", data);

    const SessionID = data.SessionID;
    const CsrfToken = data.CsrfToken;
    const ContactID = data.ContactID;
    const Cookie = cookieIDs.reduce(
      (total, cur) => `${total}; ${cur}=${data[cur]}`,
      headers["zr-cookies"]
    );
    console.log("Successfully set Sookie", Cookie);

    const { data: searchData } = await axios({
      url,
      method: "POST",
      headers: { Cookie },
      data: "p01[0]=5997&p01[1]=5998&p01[2]=5995&p01[3]=23128&p01[4]=5996&p01[5]=17679&p01[6]=6171&p01[7]=6204&p01[8]=23129&p01[9]=6205&p01[10]=6226&p01[11]=6264&p01[12]=23131&p01[13]=6263&p01[14]=23130&p01[15]=6380&p01[16]=23132&p02=08/11/2023&p03=5:00 AM&p04=7:00 PM&p05=0&p06=4&p07=false",
      params: {
        url: "https://cityofla.ezlinksgolf.com/api/search/search",
        apikey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
        custom_headers: "true",
      },
    });
    console.log("search success");

    const course = searchData["r06"][8];

    const { data: reservationData } = await axios({
      url,
      method: "POST",
      headers: { Cookie },
      data: `p02[0].r01=${course.r06}&p02[0].r02=${course.r10}&p02[0].r03=${course.r13}&p02[0].r04=${course.r12}&p02[0].r05=0&p02[0].r06=${course.r02}&p02[0].r07=${course.r20}&p01=${course.r01}&p03=${SessionID}`,
      params: {
        url: "https://cityofla.ezlinksgolf.com/api/search/reservation",
        apikey,
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
      url,
      method: "POST",
      headers: { Cookie },
      data: `r01=${course.r01}&r02=${reservationData.r02[0]}&r03=4&r04=false&r05=${ContactID}&r06=false&r07=${SessionID}&r08=${reservationData.r02[0].r06}&r09=${CsrfToken}`,
      params: {
        url: "https://cityofla.ezlinksgolf.com/api/cart/add",
        apikey,
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

      const { data: cardLinkData } = await axios({
        url,
        method: "POST",
        headers: { Cookie },
        data: `CardOnFileID=${booking_info.user_card_id}&SessionID=${SessionID}&SponsorID=${course.r06}&ContactID=${ContactID}&CourseID=${course.r07}&MasterSponsorID=${course.r06}`,
        params: {
          url: "https://cityofla.ezlinksgolf.com/api/card/link",
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
          url: "https://cityofla.ezlinksgolf.com/api/cart/finish",
          apikey,
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
    }
  } catch (err) {
    console.log(err);
  }
};

startBooking()
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
