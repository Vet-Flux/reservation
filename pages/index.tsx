import Aside from "../components/Aside";
import Header from "../components/Header";
import Calendar from "../components/Calendar";
import { useState } from "react";
import dayjs from "dayjs";
import CalendarContainer from "../components/CalendarContainer";

export default function Home() {
  return (
    <div className="flex bg-secondary-normal w-screen h-screen p-[3.5rem]">
      <Aside />
      <div className="ml-10 h-full">
        <CalendarContainer />
      </div>
    </div>
  );
}
