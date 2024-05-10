import React, { useEffect, useRef, useState } from "react";

interface CountdownProps {
  deadline: Date;
}

export const Countdown = ({ deadline }: CountdownProps) => {
  const [remaining, setRemaining] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  const timeToDisplayText = (
    time: number,
    title: string,
    displayAlsoZero: boolean
  ) => {
    if (time === 0 && !displayAlsoZero) {
      return "";
    }

    return `${time}${title}`;
  };

  function diff(a: Date, b: Date) {
    const ms = a.getTime() - b.getTime();
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const sx = "s";
    const mx = "m";
    const hx = "h";
    const dx = "d";
    const result = (
      [
        [d, dx, false],
        [(h % 24) as number, hx, d > 0],
        [(m % 60) as number, mx, h > 0],
        [(s % 60) as number, sx, m > 0],
      ] as [number, string, boolean][]
    )
      .map(([time, title, displayAlsoZero]) => {
        return timeToDisplayText(time, title, displayAlsoZero);
      })
      .join(" ")
      .trim();
    return result !== "" ? result : `0${sx}`;
  }

  useEffect(() => {
    const refreshCountdown = () => {
      if (deadline.getTime() >= new Date().getTime()) {
        setRemaining(diff(deadline, new Date()));
        timeoutRef.current = setTimeout(refreshCountdown, 1000);
      } else {
        setRemaining("");
      }
    };
    refreshCountdown();
    return () => clearTimeout(timeoutRef.current);
  }, [deadline]);
  return <> {remaining} </>;
};
