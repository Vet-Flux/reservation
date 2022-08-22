import { useState, useEffect } from "react";
import { firestore } from "../components/Firestore";
import dayjs, { Dayjs } from "dayjs";

import Aside from "../components/Aside";
import CalendarContainer from "../components/CalendarContainer";

import { CalendarEventType } from "../components/Calendar";

export interface DailyDataType {
  id: string;
  type: string;
  pet_name: string;
  animal: number;
  visit_date: string;
  visit_time: string;
  owner_name: string;
  owner_phone: string;
}

interface TestType {
  createdDate: number;
  eventDate: number;
  familyInfo: { name: string; phoneNumber: string };
  hospitalInfo: { name: string; address: string };
  petInfo: { name: string; type: number };
  key: string;
  cycleKey: number;
  purposeType: string;
  status: string;
  chiefComplaint: string;
  requester: string;
  // 보호자 || 병원
  message: string;
  vetFluxUserInfo: string;
}

// Calendar에서 다른 Week으로 이동했을 때, 선택일을 해당 Week에서 선택하면(즉 WeekData가 변경되지 않으면), Calendar 화면이 업데이트 되지 않음 -> 해결
// DatePicker의 선택 날짜가 전체의 선택일은 변경 시키지만, 외부의 선택으로는 DatePicker의 선택일이 변경되지 않음 -> 해결
//추가 이슈 - 화살표 클릭시 weekdata 불러와지지 않음 -> 주 단위만 가져올 수 있도록 변경, 기준일이 아니라 시작일 기준으로 주 데이터 가져오도록 변경

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dailyData, setDailyData] = useState<DailyDataType[]>([]);
  const [weeklyData, setWeeklyData] = useState<TestType[]>([]);
  const [startDate, setStartDate] = useState(dayjs().startOf("week").valueOf());
  const [endDate, setEndDate] = useState(dayjs().endOf("week").valueOf());
  const [calendarEvent, setCalendarEvent] = useState<CalendarEventType>({});
  const [days, setDays] = useState<Dayjs[]>([dayjs(startDate), dayjs(startDate).add(1, "day"), dayjs(startDate).add(2, "day"), dayjs(startDate).add(3, "day"), dayjs(startDate).add(4, "day"), dayjs(startDate).add(5, "day"), dayjs(startDate).add(6, "day")]);
  const [isOpenModal, setIsOpenModal] = useState<{ new: boolean; update: boolean; delete: boolean; name?: boolean }>({ new: false, update: false, delete: false });

  // 선택일 변경 시, 현재 Week 데이터 내에 있으면, Week 데이터 안에서 Daily 데이터를 가져오고,
  // Week 데이터 밖에 있다면, Start/End Date를 변경하고, Calendar의 Week을 선택일 기준으로 가져온다
  useEffect(() => {
    setDays((days: any[]) => {
      return days.map((day, idx) => (day = dayjs(selectedDate).startOf("week").add(idx, "day")));
    });
    if (startDate <= dayjs(selectedDate).valueOf() && dayjs(selectedDate).valueOf() <= endDate) {
      setDailyData([]);
      weeklyData.forEach((doc) => {
        if (selectedDate == dayjs(doc.eventDate).format("YYYY-MM-DD")) {
          setDailyData((ticket) => [
            ...ticket,
            {
              id: doc.key,
              type: doc.purposeType,
              pet_name: doc.petInfo.name,
              animal: doc.petInfo.type,
              visit_date: dayjs(doc.eventDate).format("YYYY-MM-DD"),
              visit_time: dayjs(doc.eventDate).format("HH:00"),
              owner_name: doc.familyInfo.name,
              owner_phone: doc.familyInfo.phoneNumber,
            },
          ]);
        }
      });
    } else {
      setStartDate(dayjs(selectedDate).startOf("week").valueOf());
      setEndDate(dayjs(selectedDate).endOf("week").valueOf());
    }
  }, [selectedDate]);

  //선택일이 Week 데이터의 밖에 있었을 때, Start/End Date가 변경되고, 그 때 실행되는 useEffect
  //선택일 기준으로 한 Week의 데이터를 받아와서 WeeklyData에 저장한다.
  useEffect(() => {
    console.log("왜 안바껴? 스타트 데이 바뀌잖아");
    const weekly = firestore.collection("hospital").doc("8owQXXXfuCJnix7uSkqr").collection("Reservation").where("eventDate", ">=", dayjs(startDate).startOf("week").valueOf()).where("eventDate", "<=", dayjs(startDate).endOf("week").valueOf());

    const unsubscribe = weekly.onSnapshot((docs) => {
      setWeeklyData([]);
      docs.forEach((doc) => {
        setWeeklyData((value) => [...value, doc.data() as TestType]);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [startDate]);

  // Week 데이터를 Calendar의 날짜, 시간별로 나타내기 위해 날짜, 시간별 객체로 저장한다.
  // Firestore의 불필요한 리드를 줄이기 위해, Firestore에서 Week 데이터를 가져오면, 가져온 Week 데이터에서 선택일인 Daily 데이터를 가져온다.
  useEffect(() => {
    if (weeklyData === undefined) return;

    const filteredData = weeklyData.reduce(function (acc: CalendarEventType = {}, cur) {
      let date = dayjs(cur.eventDate).format("YYYY-MM-DD");
      let time = dayjs(cur.eventDate).format("HH:00");
      let timeArray = [];
      if (acc[date] !== undefined && acc[date][time] !== undefined) timeArray = acc[date][time];

      acc[date] = { ...acc[date], [time]: [...timeArray, cur] };
      return acc;
    }, {});
    setCalendarEvent(filteredData);

    if (startDate <= dayjs(selectedDate).valueOf() && dayjs(selectedDate).valueOf() <= endDate) {
      setDailyData([]);
      weeklyData.forEach((doc) => {
        if (selectedDate == dayjs(doc.eventDate).format("YYYY-MM-DD")) {
          setDailyData((ticket) => [
            ...ticket,
            {
              id: doc.key,
              type: doc.purposeType,
              pet_name: doc.petInfo.name,
              animal: doc.petInfo.type,
              visit_date: dayjs(doc.eventDate).format("YYYY-MM-DD"),
              visit_time: dayjs(doc.eventDate).format("HH:00"),
              owner_name: doc.familyInfo.name,
              owner_phone: doc.familyInfo.phoneNumber,
            },
          ]);
        }
      });
    }
  }, [weeklyData]);

  // ** 캘린더 로직 **
  // 1. 오늘 버튼 클릭
  const clickTodayButton = () => {
    let firstDay = dayjs().startOf("week");
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
    setDays([firstDay, firstDay.add(1, "day"), firstDay.add(2, "day"), firstDay.add(3, "day"), firstDay.add(4, "day"), firstDay.add(5, "day"), firstDay.add(6, "day")]);
  };

  // 2. 선택일 기준으로 해당 Month 가져오기
  const getMonth = () => {
    if (days[0].get("year") !== days[6].get("year")) {
      return days[0].format("YYYY.MM") + " ~ " + days[6].format("YYYY.MM");
    } else if (days[0].get("month") !== days[6].get("month")) {
      return days[0].format("YYYY.MM") + " ~ " + days[6].format("MM");
    } else {
      return days[0].format("YYYY.MM");
    }
  };

  // 앞,뒤 화살표 버튼 클릭 시 Week 이동
  const moveWeek = (name: string) => {
    console.log("before_start", dayjs(startDate).date());
    if (name === "back") {
      setStartDate(dayjs(startDate).subtract(7, "day").valueOf());
      setEndDate(dayjs(endDate).subtract(7, "day").valueOf());
      setDays((days: any[]) => {
        return days.map((day) => day.subtract(7, "day"));
      });
    } else if (name === "front") {
      setStartDate(dayjs(startDate).add(7, "day").valueOf());
      setEndDate(dayjs(endDate).add(7, "day").valueOf());
      setDays((days: any[]) => {
        return days.map((day) => day.add(7, "day"));
      });
    }
  };

  // ** 모달 Open **
  const handleModal = (name: string, action: boolean) => {
    setIsOpenModal({
      new: false,
      delete: false,
      update: false,
      [name]: action,
    });
  };

  return (
    <div className="flex bg-secondary-normal w-screen h-screen p-[3.5rem]">
      <div className={"w-[25rem]"}>
        <Aside dailyData={dailyData} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      </div>
      <div className="ml-20 flex-1 h-full">
        <CalendarContainer events={calendarEvent} selectedDate={selectedDate} setSelectedDate={setSelectedDate} days={days} clickTodayButton={clickTodayButton} moveWeek={moveWeek} getMonth={getMonth} handleModal={handleModal} />
      </div>
      {/* {isOpenModal.new && <NewReservationModal messageTemplate="hi" onNextClick={onNewClick} onCancelClick={onCancelClick} />} */}
    </div>
  );
}
