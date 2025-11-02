// import React, { useState } from "react";
// import { supabase } from "../supabaseClient";
// import { Student, Seat, Reservation } from "../App";

// interface KioskViewProps {
//   students: Student[];
//   seats: Seat[];
//   reservations: Reservation[];
//   currentDate: string;
//   onDataChange: () => void;
// }

// const KioskView: React.FC<KioskViewProps> = ({
//   students,
//   seats,
//   reservations,
//   currentDate,
//   onDataChange,
// }) => {
//   const [barcodeInput, setBarcodeInput] = useState("");
//   const [selectingSeat, setSelectingSeat] = useState(false);
//   const [studentForSeatSelection, setStudentForSeatSelection] =
//     useState<Student | null>(null);
//   const [isComposing, setIsComposing] = useState(false);

//   const completeSeatSelection = async (seatId: string) => {
//     if (!studentForSeatSelection) return;

//     try {
//       const now = new Date();
//       const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(
//         now.getMinutes()
//       ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

//       const { data, error } = await supabase
//         .from("reservations")
//         .insert([
//           {
//             student_id: studentForSeatSelection.id,
//             seat_id: seatId,
//             date: currentDate,
//             status: "입실완료",
//             check_in_time: checkInTime,
//           },
//         ])
//         .select();

//       if (error) throw error;
//       if (data) {
//         const seat = seats.find((s) => s.id === seatId);
//         alert(
//           `${studentForSeatSelection.name} 입실 완료! (좌석: ${seat?.type} ${seat?.number}번)`
//         );
//         await onDataChange();
//         setSelectingSeat(false);
//         setStudentForSeatSelection(null);
//       }
//     } catch (error) {
//       console.error("입실 오류:", error);
//       alert("입실 처리에 실패했습니다.");
//     }
//   };

//   const checkIn = async (barcode: string) => {
//     const student = students.find((s) => s.barcode === barcode);

//     if (!student) {
//       alert("등록되지 않은 학생증입니다.");
//       return;
//     }

//     const reservation = reservations.find(
//       (r) => r.student_id === student.id && r.date === currentDate
//     );

//     if (reservation) {
//       if (reservation.status === "입실완료") {
//         alert("이미 입실 처리되었습니다.");
//         return;
//       }

//       try {
//         const now = new Date();
//         const checkInTime = `${String(now.getHours()).padStart(
//           2,
//           "0"
//         )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
//           now.getSeconds()
//         ).padStart(2, "0")}`;

//         const { data, error } = await supabase
//           .from("reservations")
//           .update({
//             status: "입실완료",
//             check_in_time: checkInTime,
//           })
//           .eq("id", reservation.id)
//           .select();

//         if (error) throw error;
//         if (data) {
//           alert(`${student.name} 입실 완료!`);
//           await onDataChange();
//         }
//       } catch (error) {
//         console.error("입실 오류:", error);
//         alert("입실 처리에 실패했습니다.");
//       }
//     } else {
//       // 고정 좌석 확인
//       if (student.fixed_seat_id) {
//         const isAvailable = !reservations.find(
//           (r) => r.seat_id === student.fixed_seat_id && r.date === currentDate
//         );

//         if (isAvailable) {
//           // 고정 좌석으로 자동 입실
//           try {
//             const now = new Date();
//             const checkInTime = `${String(now.getHours()).padStart(
//               2,
//               "0"
//             )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
//               now.getSeconds()
//             ).padStart(2, "0")}`;

//             const { data, error } = await supabase
//               .from("reservations")
//               .insert([
//                 {
//                   student_id: student.id,
//                   seat_id: student.fixed_seat_id,
//                   date: currentDate,
//                   status: "입실완료",
//                   check_in_time: checkInTime,
//                 },
//               ])
//               .select();

//             if (error) throw error;
//             if (data) {
//               const seat = seats.find((s) => s.id === student.fixed_seat_id);
//               alert(
//                 `${student.name} 고정좌석 입실 완료! (${seat?.type} ${seat?.number}번)`
//               );
//               await onDataChange();
//             }
//             return;
//           } catch (error) {
//             console.error("입실 오류:", error);
//             alert("입실 처리에 실패했습니다.");
//             return;
//           }
//         }
//       }

//       // 고정 좌석이 없거나 사용중이면 좌석 선택
//       setStudentForSeatSelection(student);
//       setSelectingSeat(true);
//     }
//   };

//   const availableSeats = studentForSeatSelection
//     ? seats.filter(
//         (s) =>
//           s.grade === studentForSeatSelection.grade &&
//           !reservations.find(
//             (r) => r.seat_id === s.id && r.date === currentDate
//           )
//       )
//     : [];

//   const isMobile = window.innerWidth < 768;

//   if (selectingSeat && studentForSeatSelection) {
//     return (
//       <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
//         <h1
//           style={{
//             textAlign: "center",
//             marginBottom: "15px",
//             fontSize: "20px",
//           }}
//         >
//           {studentForSeatSelection.name} - 좌석 선택
//         </h1>

//         {studentForSeatSelection.fixed_seat_id && (
//           <div
//             style={{
//               background: "#FEF3C7",
//               padding: "12px",
//               borderRadius: "8px",
//               marginBottom: "15px",
//               textAlign: "center",
//               border: "2px solid #F59E0B",
//             }}
//           >
//             <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
//               ⚠️ 고정 좌석({studentForSeatSelection.fixed_seat_id})이 사용
//               중입니다.
//               <br />
//               <span style={{ fontSize: "13px", fontWeight: "normal" }}>
//                 다른 좌석을 선택해주세요.
//               </span>
//             </p>
//           </div>
//         )}

//         <p
//           style={{
//             textAlign: "center",
//             color: "#666",
//             marginBottom: "25px",
//             fontSize: "14px",
//           }}
//         >
//           원하는 좌석을 선택해주세요 (남은 좌석: {availableSeats.length}개)
//         </p>

//         <div style={{ display: "grid", gap: "15px" }}>
//           {studentForSeatSelection.grade === 3 && (
//             <div
//               style={{
//                 border: "2px solid #ddd",
//                 borderRadius: "12px",
//                 padding: "15px",
//               }}
//             >
//               <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                 A그룹 - 3학년
//               </h3>
//               <div
//                 style={{
//                   display: "grid",
//                   gridTemplateColumns: isMobile
//                     ? "repeat(5, 1fr)"
//                     : "repeat(7, 1fr)",
//                   gap: "8px",
//                 }}
//               >
//                 {availableSeats
//                   .filter((s) => s.group === "A")
//                   .map((seat) => (
//                     <button
//                       key={seat.id}
//                       onClick={() => completeSeatSelection(seat.id)}
//                       style={{
//                         padding: isMobile ? "15px" : "18px",
//                         fontSize: isMobile ? "16px" : "18px",
//                         fontWeight: "bold",
//                         border: "2px solid #3B82F6",
//                         borderRadius: "8px",
//                         background: "white",
//                         cursor: "pointer",
//                         transition: "all 0.2s",
//                       }}
//                     >
//                       {seat.number}
//                     </button>
//                   ))}
//               </div>
//             </div>
//           )}

//           {studentForSeatSelection.grade === 2 && (
//             <>
//               <div
//                 style={{
//                   border: "2px solid #ddd",
//                   borderRadius: "12px",
//                   padding: "15px",
//                 }}
//               >
//                 <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                   B그룹 - 2학년 폐쇄형
//                 </h3>
//                 <div
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: isMobile
//                       ? "repeat(5, 1fr)"
//                       : "repeat(7, 1fr)",
//                     gap: "8px",
//                   }}
//                 >
//                   {availableSeats
//                     .filter((s) => s.group === "B")
//                     .map((seat) => (
//                       <button
//                         key={seat.id}
//                         onClick={() => completeSeatSelection(seat.id)}
//                         style={{
//                           padding: isMobile ? "12px" : "15px",
//                           fontSize: isMobile ? "14px" : "16px",
//                           fontWeight: "bold",
//                           border: "2px solid #3B82F6",
//                           borderRadius: "8px",
//                           background: "white",
//                           cursor: "pointer",
//                         }}
//                       >
//                         {seat.number}
//                       </button>
//                     ))}
//                 </div>
//               </div>

//               <div
//                 style={{
//                   border: "2px solid #ddd",
//                   borderRadius: "12px",
//                   padding: "15px",
//                 }}
//               >
//                 <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                   C그룹 - 2학년 폐쇄형
//                 </h3>
//                 <div
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: isMobile
//                       ? "repeat(5, 1fr)"
//                       : "repeat(7, 1fr)",
//                     gap: "8px",
//                   }}
//                 >
//                   {availableSeats
//                     .filter((s) => s.group === "C")
//                     .map((seat) => (
//                       <button
//                         key={seat.id}
//                         onClick={() => completeSeatSelection(seat.id)}
//                         style={{
//                           padding: isMobile ? "12px" : "15px",
//                           fontSize: isMobile ? "14px" : "16px",
//                           fontWeight: "bold",
//                           border: "2px solid #3B82F6",
//                           borderRadius: "8px",
//                           background: "white",
//                           cursor: "pointer",
//                         }}
//                       >
//                         {seat.number}
//                       </button>
//                     ))}
//                 </div>
//               </div>

//               <div
//                 style={{
//                   border: "2px solid #ddd",
//                   borderRadius: "12px",
//                   padding: "15px",
//                 }}
//               >
//                 <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                   D그룹 - 2학년 오픈형
//                 </h3>
//                 <div
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: isMobile
//                       ? "repeat(6, 1fr)"
//                       : "repeat(8, 1fr)",
//                     gap: "8px",
//                   }}
//                 >
//                   {availableSeats
//                     .filter((s) => s.group === "D")
//                     .map((seat) => (
//                       <button
//                         key={seat.id}
//                         onClick={() => completeSeatSelection(seat.id)}
//                         style={{
//                           padding: isMobile ? "12px" : "15px",
//                           fontSize: isMobile ? "14px" : "16px",
//                           fontWeight: "bold",
//                           border: "2px solid #3B82F6",
//                           borderRadius: "8px",
//                           background: "white",
//                           cursor: "pointer",
//                         }}
//                       >
//                         {seat.number}
//                       </button>
//                     ))}
//                 </div>
//               </div>
//             </>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setSelectingSeat(false);
//             setStudentForSeatSelection(null);
//           }}
//           style={{
//             marginTop: "20px",
//             width: "100%",
//             padding: "14px",
//             fontSize: "15px",
//             border: "2px solid #ddd",
//             borderRadius: "8px",
//             background: "white",
//             cursor: "pointer",
//           }}
//         >
//           취소
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
//       <h1
//         style={{
//           textAlign: "center",
//           marginBottom: "30px",
//           fontSize: "22px",
//         }}
//       >
//         자율학습실 입실
//       </h1>

//       <div
//         style={{
//           background: "#EFF6FF",
//           padding: "30px 20px",
//           borderRadius: "12px",
//           marginBottom: "25px",
//         }}
//       >
//         <p
//           style={{
//             textAlign: "center",
//             fontSize: "16px",
//             marginBottom: "15px",
//           }}
//         >
//           학생증을 스캔해주세요
//         </p>
//         <input
//           type="text"
//           value={barcodeInput}
//           onChange={(e) => setBarcodeInput(e.target.value)}
//           onCompositionStart={() => setIsComposing(true)}
//           onCompositionEnd={() => setIsComposing(false)}
//           onKeyPress={(e) => {
//             if (e.key === "Enter" && !isComposing) {
//               checkIn(barcodeInput);
//               setBarcodeInput("");
//             }
//           }}
//           placeholder="바코드 번호 (예: BC2101)"
//           style={{
//             width: "100%",
//             padding: "18px",
//             fontSize: "18px",
//             textAlign: "center",
//             border: "2px solid #3B82F6",
//             borderRadius: "8px",
//             boxSizing: "border-box",
//           }}
//           autoFocus
//         />
//         <p
//           style={{
//             textAlign: "center",
//             fontSize: "13px",
//             color: "#666",
//             marginTop: "10px",
//           }}
//         >
//           테스트: BC2101, BC3101 등
//         </p>
//       </div>

//       <div
//         style={{
//           border: "1px solid #ddd",
//           borderRadius: "8px",
//           padding: "15px",
//         }}
//       >
//         <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
//           최근 입실 기록
//         </h3>
//         {reservations
//           .filter((r) => r.status === "입실완료" && r.date === currentDate)
//           .slice(-5)
//           .reverse()
//           .map((r) => {
//             const student = students.find((s) => s.id === r.student_id);
//             const seat = seats.find((s) => s.id === r.seat_id);
//             return (
//               <div
//                 key={r.id}
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   padding: "10px 0",
//                   borderBottom: "1px solid #eee",
//                   fontSize: "14px",
//                 }}
//               >
//                 <span style={{ fontWeight: "bold" }}>
//                   {student?.name}
//                   {student?.fixed_seat_id === seat?.id && (
//                     <span style={{ color: "#10B981", marginLeft: "5px" }}>
//                       📌
//                     </span>
//                   )}
//                 </span>
//                 <span style={{ fontSize: "13px", color: "#666" }}>
//                   {seat?.type} {seat?.number}번 | {r.check_in_time}
//                 </span>
//               </div>
//             );
//           })}
//       </div>
//     </div>
//   );
// };

// export default KioskView;
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation } from "../App";

interface KioskViewProps {
  students: Student[];
  seats: Seat[];
  reservations: Reservation[];
  currentDate: string;
  onDataChange: () => void;
}

interface CheckInOverlay {
  studentName: string;
  seatInfo: string;
  status: "success" | "error";
  message: string;
}

const KioskView: React.FC<KioskViewProps> = ({
  students,
  seats,
  reservations,
  currentDate,
  onDataChange,
}) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectingSeat, setSelectingSeat] = useState(false);
  const [studentForSeatSelection, setStudentForSeatSelection] =
    useState<Student | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [overlay, setOverlay] = useState<CheckInOverlay | null>(null);

  const showOverlay = (data: CheckInOverlay) => {
    setOverlay(data);
    setTimeout(() => {
      setOverlay(null);
    }, 3000);
  };
  // completeSeatSelection 함수 수정
  const completeSeatSelection = async (seatId: string) => {
    if (!studentForSeatSelection) return;

    try {
      const now = new Date();
      const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("reservations")
        .insert([
          {
            student_id: studentForSeatSelection.id,
            seat_id: seatId,
            date: currentDate,
            status: "입실완료",
            check_in_time: checkInTime,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        const seat = seats.find((s) => s.id === seatId);

        // ✅ 오버레이 표시 수정
        setOverlay({
          studentName: studentForSeatSelection.name,
          seatInfo: `${seat?.type} ${seat?.number}번`,
          status: "success",
          message: "입실 완료!",
        });

        // 3초 후 사라짐
        setTimeout(() => {
          setOverlay(null);
          setSelectingSeat(false);
          setStudentForSeatSelection(null);
        }, 3000);

        await onDataChange();
      }
    } catch (error) {
      console.error("입실 오류:", error);
      alert("입실 처리에 실패했습니다.");
    }
  };
  const checkIn = async (barcode: string) => {
    const student = students.find((s) => s.barcode === barcode);

    if (!student) {
      alert("등록되지 않은 학생증입니다.");
      return;
    }

    const reservation = reservations.find(
      (r) => r.student_id === student.id && r.date === currentDate
    );

    if (reservation) {
      if (reservation.status === "입실완료") {
        alert("이미 입실 처리되었습니다.");
        return;
      }

      try {
        const now = new Date();
        const checkInTime = `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;

        const { data, error } = await supabase
          .from("reservations")
          .update({
            status: "입실완료",
            check_in_time: checkInTime,
          })
          .eq("id", reservation.id)
          .select();

        if (error) throw error;
        if (data) {
          const seat = seats.find((s) => s.id === reservation.seat_id);

          // ✅ 성공 오버레이
          setOverlay({
            studentName: student.name,
            seatInfo: `${seat?.type} ${seat?.number}번`,
            status: "success",
            message: "입실 완료!",
          });

          setTimeout(() => setOverlay(null), 3000);
          await onDataChange();
        }
      } catch (error) {
        console.error("입실 오류:", error);
        alert("입실 처리에 실패했습니다.");
      }
    } else {
      // 예약이 없는 경우
      if (student.fixed_seat_id) {
        const isAvailable = !reservations.find(
          (r) => r.seat_id === student.fixed_seat_id && r.date === currentDate
        );

        if (isAvailable) {
          try {
            const now = new Date();
            const checkInTime = `${String(now.getHours()).padStart(
              2,
              "0"
            )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
              now.getSeconds()
            ).padStart(2, "0")}`;

            const { data, error } = await supabase
              .from("reservations")
              .insert([
                {
                  student_id: student.id,
                  seat_id: student.fixed_seat_id,
                  date: currentDate,
                  status: "입실완료",
                  check_in_time: checkInTime,
                },
              ])
              .select();

            if (error) throw error;
            if (data) {
              const seat = seats.find((s) => s.id === student.fixed_seat_id);

              // ✅ 성공 오버레이
              setOverlay({
                studentName: student.name,
                seatInfo: `${seat?.type} ${seat?.number}번 (고정좌석)`,
                status: "success",
                message: "입실 완료!",
              });

              setTimeout(() => setOverlay(null), 3000);
              await onDataChange();
            }
            return;
          } catch (error) {
            console.error("입실 오류:", error);
            alert("입실 처리에 실패했습니다.");
            return;
          }
        }
      }

      // 좌석 선택 화면으로
      setStudentForSeatSelection(student);
      setSelectingSeat(true);
    }
  };

  const availableSeats = studentForSeatSelection
    ? seats.filter(
        (s) =>
          s.grade === studentForSeatSelection.grade &&
          !reservations.find(
            (r) => r.seat_id === s.id && r.date === currentDate
          )
      )
    : [];

  const isMobile = window.innerWidth < 768;

  // 좌석 선택 화면
  if (selectingSeat && studentForSeatSelection) {
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          minHeight: "100vh",
          background: "#F9FAFB",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
              paddingBottom: "20px",
              borderBottom: "2px solid #E5E7EB",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#1F2937",
                marginBottom: "10px",
              }}
            >
              {studentForSeatSelection.name} 학생
            </h1>
            <p style={{ fontSize: "18px", color: "#6B7280" }}>
              {studentForSeatSelection.grade}학년{" "}
              {studentForSeatSelection.class}반 {studentForSeatSelection.number}
              번
            </p>
          </div>

          {studentForSeatSelection.fixed_seat_id && (
            <div
              style={{
                background: "#FEF3C7",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "25px",
                textAlign: "center",
                border: "2px solid #F59E0B",
              }}
            >
              <p
                style={{
                  fontSize: "16px",
                  margin: 0,
                  color: "#92400E",
                  fontWeight: "bold",
                }}
              >
                ⚠️ 고정 좌석({studentForSeatSelection.fixed_seat_id})이 사용
                중입니다
                <br />
                <span style={{ fontSize: "14px", fontWeight: "normal" }}>
                  다른 빈 좌석을 선택해주세요
                </span>
              </p>
            </div>
          )}

          <p
            style={{
              textAlign: "center",
              color: "#4B5563",
              marginBottom: "30px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            사용할 좌석을 선택해주세요 (남은 좌석: {availableSeats.length}개)
          </p>

          <div style={{ display: "grid", gap: "25px" }}>
            {studentForSeatSelection.grade === 3 && (
              <div
                style={{
                  border: "2px solid #ddd",
                  borderRadius: "16px",
                  padding: "20px",
                  background: "white",
                }}
              >
                <h3
                  style={{
                    marginBottom: "15px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1F2937",
                  }}
                >
                  A그룹 - 3학년석
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "repeat(5, 1fr)"
                      : "repeat(7, 1fr)",
                    gap: "12px",
                  }}
                >
                  {availableSeats
                    .filter((s) => s.group === "A")
                    .map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => completeSeatSelection(seat.id)}
                        style={{
                          padding: isMobile ? "18px" : "24px",
                          fontSize: isMobile ? "18px" : "22px",
                          fontWeight: "bold",
                          border: "3px solid #3B82F6",
                          borderRadius: "12px",
                          background: "white",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          color: "#3B82F6",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#3B82F6";
                          e.currentTarget.style.color = "white";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.color = "#3B82F6";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {seat.number}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {studentForSeatSelection.grade === 2 && (
              <>
                <div
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: "16px",
                    padding: "20px",
                    background: "white",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "15px",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#1F2937",
                    }}
                  >
                    B그룹 - 2학년 폐쇄형
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(5, 1fr)"
                        : "repeat(7, 1fr)",
                      gap: "12px",
                    }}
                  >
                    {availableSeats
                      .filter((s) => s.group === "B")
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => completeSeatSelection(seat.id)}
                          style={{
                            padding: isMobile ? "15px" : "20px",
                            fontSize: isMobile ? "16px" : "20px",
                            fontWeight: "bold",
                            border: "3px solid #10B981",
                            borderRadius: "12px",
                            background: "white",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            color: "#10B981",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#10B981";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.color = "#10B981";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          {seat.number}
                        </button>
                      ))}
                  </div>
                </div>

                <div
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: "16px",
                    padding: "20px",
                    background: "white",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "15px",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#1F2937",
                    }}
                  >
                    C그룹 - 2학년 폐쇄형
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(5, 1fr)"
                        : "repeat(7, 1fr)",
                      gap: "12px",
                    }}
                  >
                    {availableSeats
                      .filter((s) => s.group === "C")
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => completeSeatSelection(seat.id)}
                          style={{
                            padding: isMobile ? "15px" : "20px",
                            fontSize: isMobile ? "16px" : "20px",
                            fontWeight: "bold",
                            border: "3px solid #8B5CF6",
                            borderRadius: "12px",
                            background: "white",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            color: "#8B5CF6",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#8B5CF6";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.color = "#8B5CF6";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          {seat.number}
                        </button>
                      ))}
                  </div>
                </div>

                <div
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: "16px",
                    padding: "20px",
                    background: "white",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "15px",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#1F2937",
                    }}
                  >
                    D그룹 - 2학년 오픈형
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(6, 1fr)"
                        : "repeat(8, 1fr)",
                      gap: "12px",
                    }}
                  >
                    {availableSeats
                      .filter((s) => s.group === "D")
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => completeSeatSelection(seat.id)}
                          style={{
                            padding: isMobile ? "15px" : "20px",
                            fontSize: isMobile ? "16px" : "20px",
                            fontWeight: "bold",
                            border: "3px solid #F59E0B",
                            borderRadius: "12px",
                            background: "white",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            color: "#F59E0B",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#F59E0B";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.color = "#F59E0B";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          {seat.number}
                        </button>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setSelectingSeat(false);
              setStudentForSeatSelection(null);
            }}
            style={{
              marginTop: "30px",
              width: "100%",
              padding: "18px",
              fontSize: "18px",
              border: "2px solid #E5E7EB",
              borderRadius: "12px",
              background: "white",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#6B7280",
            }}
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  // 메인 키오스크 화면
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        자율학습실 입실
      </h1>

      <div
        style={{
          background: "#EFF6FF",
          padding: "30px 20px",
          borderRadius: "16px",
          marginBottom: "30px",
          border: "2px solid #3B82F6",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: "20px",
            marginBottom: "20px",
            fontWeight: "bold",
            color: "#1F2937",
          }}
        >
          학생증을 스캔해주세요
        </p>
        <input
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isComposing) {
              checkIn(barcodeInput);
              setBarcodeInput("");
            }
          }}
          placeholder="바코드 번호 (예: BC2101)"
          style={{
            width: "100%",
            padding: "20px",
            fontSize: "22px",
            textAlign: "center",
            border: "3px solid #3B82F6",
            borderRadius: "12px",
            boxSizing: "border-box",
            fontFamily: "monospace",
          }}
          autoFocus
        />
        <p
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#6B7280",
            marginTop: "15px",
          }}
        >
          바코드를 스캔하거나 번호를 입력한 후 Enter를 누르세요
        </p>
      </div>

      {/* 좌석 배치도 */}
      <div
        style={{
          position: "relative",
          marginBottom: "20px",
          border: "2px solid #ddd",
          borderRadius: "16px",
          padding: "20px",
          background: "white",
        }}
      >
        <h3
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          좌석 배치도
        </h3>
        <div style={{ position: "relative" }}>
          <img
            src="https://raw.githubusercontent.com/skywind99/temp/refs/heads/main/anigo5f.PNG"
            alt="좌석 배치도"
            style={{
              width: "100%",
              maxWidth: "900px",
              margin: "0 auto",
              display: "block",
              borderRadius: "8px",
            }}
          />

          {/* 입실 확인 오버레이 */}
          {overlay && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.85)",
                borderRadius: "8px",
                animation: "fadeIn 0.3s ease-in-out",
              }}
            >
              <div
                style={{
                  background:
                    overlay.status === "success" ? "#10B981" : "#EF4444",
                  padding: "40px 60px",
                  borderRadius: "20px",
                  textAlign: "center",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                  transform: "scale(1)",
                  animation: "scaleIn 0.3s ease-out",
                }}
              >
                <div
                  style={{
                    fontSize: "72px",
                    marginBottom: "20px",
                  }}
                >
                  {overlay.status === "success" ? "✓" : "✗"}
                </div>
                <h2
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "15px",
                  }}
                >
                  {overlay.studentName || overlay.message}
                </h2>
                {overlay.seatInfo && (
                  <p
                    style={{
                      fontSize: "28px",
                      color: "white",
                      marginBottom: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {overlay.seatInfo}
                  </p>
                )}
                <p
                  style={{
                    fontSize: "24px",
                    color: "white",
                    margin: 0,
                  }}
                >
                  {overlay.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 최근 입실 기록 */}
      <div
        style={{
          border: "2px solid #ddd",
          borderRadius: "16px",
          padding: "20px",
          background: "white",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            marginBottom: "15px",
            fontWeight: "bold",
          }}
        >
          최근 입실 기록
        </h3>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {reservations
            .filter((r) => r.status === "입실완료" && r.date === currentDate)
            .slice(-10)
            .reverse()
            .map((r, index) => {
              const student = students.find((s) => s.id === r.student_id);
              const seat = seats.find((s) => s.id === r.seat_id);
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px",
                    borderBottom: index === 9 ? "none" : "1px solid #E5E7EB",
                    fontSize: "16px",
                    background: index % 2 === 0 ? "#F9FAFB" : "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "18px",
                        color: "#1F2937",
                      }}
                    >
                      {student?.name}
                    </span>
                    {student?.fixed_seat_id === seat?.id && (
                      <span
                        style={{
                          background: "#10B981",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        📌 고정
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      color: "#6B7280",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      {seat?.type} {seat?.number}번
                    </span>
                    <span style={{ fontSize: "14px" }}>{r.check_in_time}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes scaleIn {
            from {
              transform: scale(0.8);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default KioskView;
