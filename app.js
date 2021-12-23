const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const dbpath = path.join(__dirname, "twitterClone.db");
let db;
const intializeDbandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server start running http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
const authenticationToken = (request, response, next) => {
  let jwttoken;
  const authheader = request.headers["authorization"];
  if (authheader !== undefined) {
    jwttoken = authheader.split(" ")[1];
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
  if (jwttoken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    let isjwttokenmatch = jwt.verify(
      jwttoken,
      "MY_CODE",
      async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          let u1 = payload.username;

          request.user1 = u1;
          next();
        }
      }
    );
  }
};
let checking1 = async (request, response, next) => {
  let { username = "" } = request.body;
  let getuserQuery = `select * from user where username='${username}';`;
  let userdetail = await db.get(getuserQuery);
  if (userdetail !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    next();
  }
};
const convertusertoresobj = (dbobject) => {
  return {
    userId: dbobject.user_id,
    name: dbobject.name,
    username: dbobject.username,
    password: dbobject.password,
    gender: dbobject.gender,
  };
};
const convertfollowertoresobj = (dbobject) => {
  return {
    followerId: dbobject.follower_id,
    followerUserId: dbobject.follower_user_id,
    followingUserId: dbobject.following_user_id,
  };
};
const converttweettoresobj = (dbobject) => {
  return {
    tweetId: dbobject.tweet_id,
    tweet: dbobject.tweet,
    userId: dbobject.user_id,
    dateTime: dbobject.date_time,
  };
};
const convertreplytoresobj = (dbobject) => {
  return {
    replyId: dbobject.reply_id,
    tweetId: dbobject.tweet_id,
    reply: dbobject.reply,
    userId: dbobject.user_id,
    dateTime: dbobject.date_time,
  };
};
const convertliketoresobj = (dbobject) => {
  return {
    likeId: dbobject.like_id,
    tweetId: dbobject.tweet_id,
    userId: dbobject.user_id,
    dateTime: dbobject.date_time,
  };
};

//Api1
app.post("/register/", checking1, async (request, response) => {
  let { username = "", password = "", name = "", gender = "" } = request.body;
  let len_passwod = password.length;
  if (len_passwod > 6) {
    let hashedpass = await bcrypt.hash(request.body.password, 10);
    let creuserdata = `insert into user
(name,username,password,gender)
values
('${name}',
'${username}',
'${hashedpass}',
'${gender}');`;
    let adduserdata = await db.run(creuserdata);
    response.status(200);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("Password is too short");
  }
});
//API2
app.post("/login/", async (request, response) => {
  let { username = "", password = "" } = request.body;
  let userdetail = `select * from user where username='${username}';`;
  let dbuser = await db.get(userdetail);
  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const ispassmatch = await bcrypt.compare(password, dbuser.password);
    if (ispassmatch === true) {
      let payload = { username: username };
      let jwtToken = await jwt.sign(payload, "MY_CODE");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//Api3
app.get(
  "/user/tweets/feed/",
  authenticationToken,
  async (request, response) => {
    let getQuery = `select username,tweet,date_time from user inner join tweet on user.user_id=tweet.user_id
     order by user.user_id asc limit 4;`;
    let gettweet = await db.all(getQuery);
    response.send({
      username: gettweet.username,
      tweet: gettweet.tweet,
      dateTime: gettweet.date_time,
    });
  }
);
//API4
app.get("/user/following/", authenticationToken, async (request, response) => {
  let getnamesQuery = `select name from user inner join follower on user.user_id=follower.follower_user_id;`;
  let namedetails = await db.all(getnamesQuery);
  response.send(convertusertoresobj(namedetails));
});

//API5
app.get("/user/followers/", authenticationToken, async (request, response) => {
  let getnamesQuery = `select name from user inner join follower on user.user_id=follower.follower_user_id;`;
  let namedetails = await db.all(getnamesQuery);
  response.send(convertusertoresobj(namedetails));
});
//API6
app.get("/tweets/:tweetId/", authenticationToken, async (request, response) => {
  let getnamesQuery = `select name from user inner join follower on user.user_id=follower.follower_user_id;`;
  let namedetails = await db.all(getnamesQuery);
  response.send(convertusertoresobj(namedetails));
});
//API7
app.get(
  "/tweets/:tweetId/likes/",
  authenticationToken,
  async (request, response) => {
    let getnamesQuery = `select name from user inner join follower on user.user_id=follower.follower_user_id;`;
    let namedetails = await db.all(getnamesQuery);
    response.send(convertusertoresobj(namedetails));
  }
);
//API8
app.get(
  "/tweets/:tweetId/replies/",
  authenticationToken,
  async (request, response) => {
    let { tweetId } = request.param;
    let getnamesQuery = `select name,reply from user inner join reply on user.user_id=reply.user_id
    reply.tweet_id=${tweetId};`;
    let namedetails = await db.all(getnamesQuery);
    if (namedetails !== undefined) {
      response.send({
        replies: [
          {
            name: `${namedetails.name}`,
            reply: `${namedetails.reply}`,
          },
        ],
      });
    } else {
      response.send("Invalid Request");
    }
  }
);
//API9
app.get("/user/tweets/", authenticationToken, async (request, response) => {
  let getnamesQuery = `select name from user inner join follower on user.user_id=follower.follower_user_id;`;
  let namedetails = await db.all(getnamesQuery);
  response.send(convertusertoresobj(namedetails));
});
//API10
app.post("/user/tweets/", authenticationToken, async (request, response) => {
  let { tweet } = request.body;
  let CreateTweetQuery = `insert into tweet(tweet)values('${tweet}');`;
  let namedetails = await db.run(CreateTweetQuery);
  response.send("Created a Tweet");
});
const checking2 = async (request, response, next) => {
  let { tweetId } = request.params;
  let del1 = `select user_id from tweet where tweet_id='${tweetId}'`;
  let del2 = await db.get(del1);
  if (del2 === undefined) {
    next();

    request.status(401);
    request.send("Invalid Request");
  }
};
//API11
app.delete(
  "/tweets/:tweetId/",
  authenticationToken,
  async (request, response) => {
    let { tweetId } = request.params;
    let { user1 } = request;
    let usid1 = `select user_id from user where username like'%${user1}%'`;
    let usid2 = await db.get(usid1);
    let tweet1 = `select tweet_id from tweet where user_id='${usid2}'`;
    let tweet2 = await db.get(tweet1);
    console.log(tweet2);
    if (tweet2 === undefined) {
      let getnamesQuery = `delete  from tweet  where tweet_id='${tweetId}';`;
      let namedetails = await db.run(getnamesQuery);

      response.send("Tweet Removed");
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);
intializeDbandServer();
module.exports = app;
