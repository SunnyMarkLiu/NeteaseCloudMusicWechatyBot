/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   Copyright 2016-2017 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

/* tslint:disable:variable-name */
const QrcodeTerminal = require('qrcode-terminal');
const finis = require('finis');
const exec = require('child_process').exec;

/**
 * Change `import { ... } from '../'`
 * to     `import { ... } from 'wechaty'`
 * when you are runing with Docker or NPM instead of Git Source.
 */

const {Wechaty, MediaMessage, config, log} = require('wechaty')

const welcome = `
| __        __        _           _
| \\ \\      / /__  ___| |__   __ _| |_ _   _
|  \\ \\ /\\ / / _ \\/ __| '_ \\ / _\` | __| | | |
|   \\ V  V /  __/ (__| | | | (_| | |_| |_| |
|    \\_/\\_/ \\___|\\___|_| |_|\\__,_|\\__|\\__, |
|                                     |___/

=============== Powered by Wechaty ===============
-------- https://github.com/zixia/wechaty --------

I'm a bot, my super power is talk in Wechat.
__________________________________________________

Hope you like it, and you are very welcome to
upgrade me for more super powers!

Please wait... I'm trying to login in...

`;

console.log(welcome);
const bot = Wechaty.instance();

bot
    .on('logout', user => log.info('Bot', `${user.name()} logouted`))
    .on('login', user => {
        log.info('Bot', `${user.name()} logined`);
        bot.say('Wechaty login')
    })
    .on('error', e => {
        log.info('Bot', 'error: %s', e);
        bot.say('Wechaty error: ' + e.message)
    })
    .on('scan', (url, code) => {
        if (!/201|200/.test(String(code))) {
            const loginUrl = url.replace(/\/qrcode\//, '/l/');
            QrcodeTerminal.generate(loginUrl)
        }
        console.log(`${url}\n[${code}] Scan QR Code in above url to login: `)
    })
    .on('message', m => {
        try {
            const room = m.room();
            console.log((room ? '[' + room.topic() + ']' : '')
                + '<' + m.from().name() + '>'
                + ':' + m.toStringDigest()
            );
            if(room == null) {

                if (/^(网易云音乐)$/i.test(m.content()) && !m.self()) {
                    m.say('请输入要听的歌名？');
                }

                if (!/^(网易云音乐)$/i.test(m.content()) &&!m.self()) {
                    var song_name = m.content();
                    song_name = song_name.trim();
                    exec('python netease_song_spider.py ' + song_name, function (error, stdout, stderr) {
                        if (stdout.length > 1) {
                            var song_id = stdout;
                            song_id = song_id.trim();
                            console.log('song_id:'+song_id);
                            if(song_id == -1){
                                m.say('未找到匹配的歌曲！');
                            } else {
                                const cmd = 'python netease_lyric.py --sid '+song_id;
                                exec(cmd, function (error, stdout, stderr) {
                                    console.log('error'+error);
                                    console.log('stdout'+stdout);
                                    console.log('stderr'+stderr);
                                    var pic = __dirname + '/images/'+stdout;
                                    pic = pic.trim();
                                    console.log('pic: '+pic);
                                    m.say(new MediaMessage(pic));
                                });
                            }
                        }
                    });
                }
            }
        } catch (e) {
            log.error('Bot', 'on(message) exception: %s', e)
        }
    });

bot.init()
    .catch(e => {
        log.error('Bot', 'init() fail: %s', e);
        bot.quit();
        process.exit(-1)
    });

finis((code, signal) => {
    const exitMsg = `Wechaty exit ${code} because of ${signal} `;
    console.log(exitMsg);
    bot.say(exitMsg)
});
