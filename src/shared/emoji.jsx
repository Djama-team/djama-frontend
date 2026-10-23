import { useState } from 'react';

const GROUPS = [
  ['😀', '😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😜 🤪 😎 🤗 🤔 🤭 😐 😶 🙄 😏 😴 😢 😭 😤 😡 🥺 😱 😳 🤒 🤕 🥳'],
  ['👍', '👍 👎 👏 🙌 🙏 🤝 💪 👌 ✌️ 🤞 🤟 👋 ✋ 🖐️ 👊 ✊ 🫶 🤲 👀 🧠 🫡'],
  ['❤️', '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 💕 💖 💯 🔥 ✨ ⭐ 🎉 🎊 🎁 🏆 ⚽ 🎵 🎶'],
  ['🌍', '🌍 🌅 🌳 🌸 🌞 🌙 ☀️ ⛅ 🌧️ 🐶 🐱 🦁 🐘 🐓 🍎 🍌 🍉 🍕 🍔 🍚 ☕ 🍵 🚗 ✈️ 🏠 📱 💻 📚 💡 📞']
];

export default function EmojiPicker({ onPick }) {
  const [tab, setTab] = useState(0);
  return (
    <div className="emoji" onMouseDown={(e) => e.preventDefault()}>
      <div className="emoji-tabs">
        {GROUPS.map(([icon], i) => <button type="button" key={icon} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>{icon}</button>)}
      </div>
      <div className="emoji-grid">
        {GROUPS[tab][1].split(' ').map((e) => <button type="button" key={e} onClick={() => onPick(e)}>{e}</button>)}
      </div>
    </div>
  );
}
