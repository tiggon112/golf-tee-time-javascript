const axios = require("axios");

let url = "https://cityofla.ezlinksgolf.com/api/login/login";
const apikey = "86f3b3a15a335d993a9e3ed5986872244d31d2c3";
const cookieIDs = ["AuthorizationCode", "ContactID"];
axios({
  url: "https://api.zenrows.com/v1/",
  method: "POST",
  data: "Login=eliert0327&MasterSponsorID=13358&Password=PICpic123!@#&SessionID=",
  params: {
    url,
    apikey,
    js_render: "true",
    antibot: "true",
    premium_proxy: "true",
    original_status: "true",
    device: "desktop",
  },
})
  .then((response) => {
    const SessionID = response.data.SessionID;
    url = "https://cityofla.ezlinksgolf.com/api/search/search";
    const Cookie = cookieIDs.reduce(
      (total, cur) => `${total};${cur}=${response.data[cur]}`,
      response.headers["zr-cookies"]
    );
    console.log(Cookie);
    axios({
      url: "https://api.zenrows.com/v1/",
      method: "POST",
      headers: { Cookie },
      data: "p01[0]=5997&p01[1]=5998&p01[2]=5995&p01[3]=23128&p01[4]=5996&p01[5]=17679&p01[6]=6171&p01[7]=6204&p01[8]=23129&p01[9]=6205&p01[10]=6226&p01[11]=6264&p01[12]=23131&p01[13]=6263&p01[14]=23130&p01[15]=6380&p01[16]=23132&p02=08/11/2023&p03=5:00 AM&p04=7:00 PM&p05=0&p06=4&p07=false",
      params: {
        url,
        apikey,
        js_render: "true",
        antibot: "true",
        premium_proxy: "true",
        original_status: "true",
        device: "desktop",
        custom_headers: "true",
      },
    })
      .then((response) => {
        console.log(response.data["r06"][8]);
        const course = response.data["r06"][8];
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
          p03: SessionID,
        };
      })
      .catch((error) => console.log(error));
  })
  .catch((error) => console.log(error));
