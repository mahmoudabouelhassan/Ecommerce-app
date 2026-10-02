const colors = {
  blue: "bg-blue-600 text-white",
  red: "bg-red-600 text-white",
  amber: "bg-amber-500 text-slate-950",
  green: "bg-green-600 text-white",
  purple: "bg-purple-600 text-white",
  slate: "bg-slate-700 text-white",
};

export const badgeClassName = (color) => `inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-xs font-bold ${colors[color] || colors.slate}`;

export const badgeStyle = (color) => {
  if (typeof color !== "string" || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return undefined;
  const hex = color.length === 4 ? [...color.slice(1)].map((digit) => digit + digit).join("") : color.slice(1);
  const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return { backgroundColor: color, color: luminance > 0.179 ? "#0f172a" : "#ffffff" };
};
