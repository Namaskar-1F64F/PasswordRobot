import Logger from '../util/logger';
import { interfaceEmitter, sendMessage } from '../interface';
import { createHash } from 'crypto';
import { encode } from 'utf8';
import fetch from 'node-fetch';

Logger.info(`Connected PW Robot.`);
interfaceEmitter.on("message", async (id, message) => {
  Logger.info(`Received message in password.`);
  let { text, username, title } = message;
  if (text.length > 1 && (text[0] === "/" || text[0] === "!")) {
    if(text.includes('@')) text = text.split('@')[0];
    const fullCommand = text.substring(1);
    const split = fullCommand.split(' ');
    const command = split[0].toLowerCase();
    const args = split.splice(1);
    Logger.info(`Received command from ${username} in chat ${title} (${id}): ${fullCommand}`);
    return commandHandler(command, args, { id, title });
  }
});

const commandHandler = (command, args, context) => {
  if (command == null) {
    return;
  } else if (command == 'hasmypasswordbeenhacked') {
    const [password] = args;
    passwordCommand({ ...context, password });
  } else if (command == 'start') {
    helpCommand({ ...context });
  } else if (command == 'help') {
    helpCommand({ ...context });
  }
}

const passwordCommand = ({ id, password }) => {
  if (password == null) {
    const message = `I can't check if your password has been stolen if you don't give it to me, HA!\n\`/hasmypasswordbeenhacked <password goes here, dummy>\``;
    Logger.verbose(message);
    sendMessage(id, { text: message }, { parse_mode: 'Markdown' });
    return;
  }
  const utf = encode(password);
  console.log(utf);

  const sha1 = createHash('sha1');
  sha1.update(utf);
  const sha = sha1.digest('hex');
  console.log(sha)
  fetch(`https://api.pwnedpasswords.com/range/${sha.substring(0, 5)}`)
    .then(res => res.text())
    .then(body => {
      const res = body.split('\r\n').filter(split => split.split(':')[0] == sha.substring(5).toUpperCase());
      console.log(res);
      if (res.length > 0)
        return sendMessage(id, { text: `Bad luck, I've found the password "${password}" in ${res[0].split(':')[1]} different password lists!` });
      sendMessage(id, { text: `Good luck, I didn't find that one! Too bad it's compromised now.` });
    }).catch(e => { console.log(e) });
}

const helpCommand = ({ id }) => {
  sendMessage(id, { text: `Hey I am a super secure robot to tell you if your password is hacked.` });
}
