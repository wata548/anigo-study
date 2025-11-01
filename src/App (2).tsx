// import React, { useState, useEffect } from "react";
// import { supabase } from "./supabaseClient";
// import "./styles.css";

// // 타입 정의
// interface Student {
//   id: string;
//   grade: number;
//   class: number;
//   number: number;
//   name: string;
//   barcode: string;
//   password?: string;
// }

// interface User {
//   id: string;
//   email: string;
//   role: string;
//   name: string;
//   password?: string;
// }

// interface Seat {
//   id: string;
//   type: string;
//   number: number;
//   grade: number;
//   group: string;
// }

// interface Reservation {
//   id: number;
//   student_id: string;
//   seat_id: string;
//   date: string;
//   status: string;
//   check_in_time?: string;
// }

// interface Absence {
//   id: number;
//   student_id: string;
//   date: string;
//   reason: string;
//   note?: string;
// }

// // 좌석 생성
// const generateSeats = (): Seat[] => {
//   const seats: Seat[] = [];
//   for (let i = 1; i <= 31; i++) {
//     seats.push({
//       id: `A-${i}`,
//       type: "A그룹(3학년)",
//       number: i,
//       grade: 3,
//       group: "A",
//     });
//   }
//   for (let i = 1; i <= 39; i++) {
//     seats.push({
//       id: `B-${i}`,
//       type: "B그룹(2폐쇄)",
//       number: i,
//       grade: 2,
//       group: "B",
//     });
//   }
//   for (let i = 1; i <= 26; i++) {
//     seats.push({
//       id: `C-${i}`,
//       type: "C그룹(2폐쇄)",
//       number: i,
//       grade: 2,
//       group: "C",
//     });
//   }
//   for (let i = 1; i <= 32; i++) {
//     seats.push({
//       id: `D-${i}`,
//       type: "D그룹(2오픈)",
//       number: i,
//       grade: 2,
//       group: "D",
//     });
//   }
//   return seats;
// };

// const App: React.FC = () => {
//   const [view, setView] = useState("dashboard");
//   const [students, setStudents] = useState<Student[]>([]);
//   const [seats] = useState<Seat[]>(generateSeats());
//   const [reservations, setReservations] = useState<Reservation[]>([]);
//   const [absences, setAbsences] = useState<Absence[]>([]);
//   const [currentDate] = useState(new Date().toISOString().split("T")[0]);
//   const [barcodeInput, setBarcodeInput] = useState("");
//   const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
//   const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [selectingSeat, setSelectingSeat] = useState(false);
//   const [studentForSeatSelection, setStudentForSeatSelection] =
//     useState<Student | null>(null);

//   // 로그인 관련 state
//   const [showLogin, setShowLogin] = useState(false);
//   const [loginType, setLoginType] = useState<"student" | "teacher" | "admin">(
//     "student"
//   );
//   const [loginForm, setLoginForm] = useState({
//     grade: 2,
//     class: 1,
//     number: 1,
//     password: "",
//     email: "",
//     barcode: "",
//   });

//   // 한글 입력 처리를 위한 state
//   const [isComposing, setIsComposing] = useState(false);

//   // 로그인 폼 초기화
//   const resetLoginForm = () => {
//     setLoginForm({
//       grade: 2,
//       class: 1,
//       number: 1,
//       password: "",
//       email: "",
//       barcode: "",
//     });
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       const { data: studentsData, error: studentsError } = await supabase
//         .from("students")
//         .select("*")
//         .order("grade", { ascending: true })
//         .order("class", { ascending: true })
//         .order("number", { ascending: true });

//       if (studentsError) throw studentsError;
//       setStudents(studentsData || []);

//       const { data: reservationsData, error: reservationsError } =
//         await supabase.from("reservations").select("*").eq("date", currentDate);

//       if (reservationsError) throw reservationsError;
//       setReservations(reservationsData || []);

//       const { data: absencesData, error: absencesError } = await supabase
//         .from("absences")
//         .select("*")
//         .eq("date", currentDate);

//       if (absencesError) throw absencesError;
//       setAbsences(absencesData || []);

//       setLoading(false);
//     } catch (error) {
//       console.error("데이터 로드 오류:", error);
//       alert("데이터를 불러오는데 실패했습니다. Supabase 설정을 확인해주세요.");
//       setLoading(false);
//     }
//   };

//   // 좌석 선택 완료 (키오스크용)
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
//         setReservations([...reservations, data[0]]);
//         const seat = seats.find((s) => s.id === seatId);
//         alert(
//           `${studentForSeatSelection.name} 입실 완료! (좌석: ${seat?.type} ${seat?.number}번)`
//         );
//         await loadData();
//         setSelectingSeat(false);
//         setStudentForSeatSelection(null);
//       }
//     } catch (error) {
//       console.error("입실 오류:", error);
//       alert("입실 처리에 실패했습니다.");
//     }
//   };

//   // 로그인 처리
//   const handleLogin = async () => {
//     try {
//       if (loginType === "student") {
//         const studentId = `${loginForm.grade}${loginForm.class}${String(
//           loginForm.number
//         ).padStart(2, "0")}`;
//         const { data, error } = await supabase
//           .from("students")
//           .select("*")
//           .eq("id", studentId)
//           .eq("password", loginForm.password)
//           .single();

//         if (error || !data) {
//           alert("학년, 반, 번호 또는 비밀번호가 일치하지 않습니다.");
//           return;
//         }

//         setLoggedInStudent(data);
//         setShowLogin(false);
//         setView("student");
//         resetLoginForm();
//         alert(`${data.name}님 환영합니다!`);
//       } else {
//         const { data, error } = await supabase
//           .from("users")
//           .select("*")
//           .eq("email", loginForm.email)
//           .eq("password", loginForm.password)
//           .eq("role", loginType === "admin" ? "admin" : "teacher")
//           .single();

//         if (error || !data) {
//           alert("이메일 또는 비밀번호가 일치하지 않습니다.");
//           return;
//         }

//         setLoggedInUser(data);
//         setShowLogin(false);
//         setView(loginType === "admin" ? "admin" : "teacher");
//         resetLoginForm();
//         alert(`${data.name}님 환영합니다!`);
//       }
//     } catch (error) {
//       console.error("로그인 오류:", error);
//       alert("로그인에 실패했습니다.");
//     }
//   };

//   // 바코드 로그인
//   const handleBarcodeLogin = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("students")
//         .select("*")
//         .eq("barcode", loginForm.barcode)
//         .single();

//       if (error || !data) {
//         alert("등록되지 않은 바코드입니다.");
//         return;
//       }

//       setLoggedInStudent(data);
//       setShowLogin(false);
//       setView("student");
//       resetLoginForm();
//       alert(`${data.name}님 환영합니다!`);
//     } catch (error) {
//       console.error("바코드 로그인 오류:", error);
//       alert("로그인에 실패했습니다.");
//     }
//   };

//   // 로그아웃
//   const handleLogout = () => {
//     setLoggedInStudent(null);
//     setLoggedInUser(null);
//     setView("dashboard");
//     alert("로그아웃되었습니다.");
//   };

//   // 관리자 명단 관리 페이지
//   const AdminView = () => {
//     if (!loggedInUser || loggedInUser.role !== "admin") {
//       return (
//         <div style={{ padding: "20px", textAlign: "center" }}>
//           <p>관리자 로그인이 필요합니다.</p>
//         </div>
//       );
//     }

//     const downloadExcel = () => {
//       const csv = [
//         ["학년", "반", "번호", "이름", "바코드", "비밀번호"].join(","),
//         ...students.map((s) =>
//           [
//             s.grade,
//             s.class,
//             s.number,
//             s.name,
//             s.barcode,
//             s.password || "",
//           ].join(",")
//         ),
//       ].join("\n");

//       const blob = new Blob(["\uFEFF" + csv], {
//         type: "text/csv;charset=utf-8;",
//       });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `학생명단_${currentDate}.csv`;
//       link.click();
//       alert("학생 명단이 다운로드되었습니다.");
//     };

//     const uploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
//       const file = e.target.files?.[0];
//       if (!file) return;

//       const reader = new FileReader();
//       reader.onload = async (event) => {
//         try {
//           const text = event.target?.result as string;
//           const rows = text.split("\n").slice(1);
//           const newStudents = rows
//             .map((row) => {
//               const [grade, classNum, number, name, barcode, password] =
//                 row.split(",");
//               const id = `${grade}${classNum}${String(number).padStart(
//                 2,
//                 "0"
//               )}`;
//               return {
//                 id,
//                 grade: parseInt(grade),
//                 class: parseInt(classNum),
//                 number: parseInt(number),
//                 name: name?.trim(),
//                 barcode: barcode?.trim(),
//                 password: password?.trim() || "0000",
//               };
//             })
//             .filter((s) => s.name && s.barcode);

//           if (newStudents.length === 0) {
//             alert("유효한 데이터가 없습니다.");
//             return;
//           }

//           const { error: deleteError } = await supabase
//             .from("students")
//             .delete()
//             .neq("id", "");

//           if (deleteError) throw deleteError;

//           const { error: insertError } = await supabase
//             .from("students")
//             .insert(newStudents);

//           if (insertError) throw insertError;

//           alert(`${newStudents.length}명의 학생 데이터가 업로드되었습니다.`);
//           await loadData();
//         } catch (error) {
//           console.error("업로드 오류:", error);
//           alert("업로드에 실패했습니다. CSV 형식을 확인해주세요.");
//         }
//       };
//       reader.readAsText(file);
//     };

//     return (
//       <div style={{ padding: "15px", maxWidth: "1200px", margin: "0 auto" }}>
//         <div
//           style={{
//             display: "flex",
//             flexDirection: window.innerWidth < 768 ? "column" : "row",
//             justifyContent: "space-between",
//             alignItems: window.innerWidth < 768 ? "stretch" : "center",
//             marginBottom: "20px",
//             gap: "10px",
//           }}
//         >
//           <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
//             학생 명단 관리
//           </h1>
//           <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
//             <label
//               style={{
//                 padding: "10px 16px",
//                 background: "#10B981",
//                 color: "white",
//                 borderRadius: "8px",
//                 cursor: "pointer",
//                 fontWeight: "bold",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 fontSize: "14px",
//                 flex: window.innerWidth < 768 ? "1" : "auto",
//                 justifyContent: "center",
//               }}
//             >
//               📤 업로드
//               <input
//                 type="file"
//                 accept=".csv"
//                 onChange={uploadExcel}
//                 style={{ display: "none" }}
//               />
//             </label>
//             <button
//               onClick={downloadExcel}
//               style={{
//                 padding: "10px 16px",
//                 background: "#3B82F6",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "8px",
//                 cursor: "pointer",
//                 fontWeight: "bold",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 fontSize: "14px",
//                 flex: window.innerWidth < 768 ? "1" : "auto",
//                 justifyContent: "center",
//               }}
//             >
//               📥 다운로드
//             </button>
//           </div>
//         </div>

//         <div
//           style={{
//             background: "#FEF3C7",
//             padding: "12px",
//             borderRadius: "8px",
//             marginBottom: "15px",
//           }}
//         >
//           <p style={{ fontSize: "13px", margin: 0, lineHeight: "1.4" }}>
//             💡 CSV 형식: 학년,반,번호,이름,바코드,비밀번호
//           </p>
//         </div>

//         <div
//           style={{
//             background: "white",
//             borderRadius: "12px",
//             overflow: "auto",
//             border: "1px solid #ddd",
//           }}
//         >
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               minWidth: "600px",
//             }}
//           >
//             <thead>
//               <tr style={{ background: "#F3F4F6" }}>
//                 <th
//                   style={{
//                     padding: "12px 8px",
//                     textAlign: "center",
//                     borderBottom: "2px solid #ddd",
//                     fontSize: "14px",
//                   }}
//                 >
//                   학년
//                 </th>
//                 <th
//                   style={{
//                     padding: "12px 8px",
//                     textAlign: "center",
//                     borderBottom: "2px solid #ddd",
//                     fontSize: "14px",
//                   }}
//                 >
//                   반
//                 </th>
//                 <th
//                   style={{
//                     padding: "12px 8px",
//                     textAlign: "center",
//                     borderBottom: "2px solid #ddd",
//                     fontSize: "14px",
//                   }}
//                 >
//                   번호
//                 </th>
//                 <th
//                   style={{
//                     padding: "12px 8px",
//                     textAlign: "left",
//                     borderBottom: "2px solid #ddd",
//                     fontSize: "14px",
//                   }}
//                 >
//                   이름
//                 </th>
//                 <th
//                   style={{
//                     padding: "12px 8px",
//                     textAlign: "left",
//                     borderBottom: "2px solid #ddd",
//                     fontSize: "14px",
//                   }}
//                 >
//                   바코드
//                 </th>
//                 <th
//                   style={{
//                     padding: "12px 8px",
//                     textAlign: "center",
//                     borderBottom: "2px solid #ddd",
//                     fontSize: "14px",
//                   }}
//                 >
//                   비밀번호
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {students.map((s, idx) => (
//                 <tr
//                   key={s.id}
//                   style={{ background: idx % 2 === 0 ? "white" : "#F9FAFB" }}
//                 >
//                   <td
//                     style={{
//                       padding: "10px 8px",
//                       textAlign: "center",
//                       borderBottom: "1px solid #E5E7EB",
//                       fontSize: "14px",
//                     }}
//                   >
//                     {s.grade}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px 8px",
//                       textAlign: "center",
//                       borderBottom: "1px solid #E5E7EB",
//                       fontSize: "14px",
//                     }}
//                   >
//                     {s.class}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px 8px",
//                       textAlign: "center",
//                       borderBottom: "1px solid #E5E7EB",
//                       fontSize: "14px",
//                     }}
//                   >
//                     {s.number}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px 8px",
//                       borderBottom: "1px solid #E5E7EB",
//                       fontSize: "14px",
//                     }}
//                   >
//                     {s.name}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px 8px",
//                       fontFamily: "monospace",
//                       fontSize: "13px",
//                       borderBottom: "1px solid #E5E7EB",
//                     }}
//                   >
//                     {s.barcode}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px 8px",
//                       textAlign: "center",
//                       fontFamily: "monospace",
//                       fontSize: "13px",
//                       borderBottom: "1px solid #E5E7EB",
//                     }}
//                   >
//                     {s.password || "****"}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div
//           style={{
//             marginTop: "15px",
//             textAlign: "center",
//             color: "#666",
//             fontSize: "14px",
//           }}
//         >
//           총 {students.length}명
//         </div>
//       </div>
//     );
//   };

//   // 조회 페이지
//   const QueryView = () => {
//     const [queryDate, setQueryDate] = useState(currentDate);
//     const [queryGrade, setQueryGrade] = useState(2);

//     const gradeStudents = students.filter((s) => s.grade === queryGrade);
//     const dateReservations = reservations.filter((r) => r.date === queryDate);
//     const dateAbsences = absences.filter((a) => a.date === queryDate);

//     const dateData = gradeStudents.map((s) => {
//       const res = dateReservations.find((r) => r.student_id === s.id);
//       const abs = dateAbsences.find((a) => a.student_id === s.id);
//       return { ...s, reservation: res, absence: abs };
//     });

//     const dateStats = {
//       total: gradeStudents.length,
//       checkedIn: dateData.filter((s) => s.reservation?.status === "입실완료")
//         .length,
//       reserved: dateData.filter((s) => s.reservation?.status === "예약").length,
//       noShow: dateData.filter((s) => s.reservation?.status === "미입실").length,
//       absent: dateData.filter((s) => s.absence).length,
//     };

//     const downloadReport = () => {
//       const csv = [
//         ["학년", "반", "번호", "이름", "상태", "사유"].join(","),
//         ...dateData.map((s) =>
//           [
//             s.grade,
//             s.class,
//             s.number,
//             s.name,
//             s.reservation?.status === "입실완료"
//               ? "출석"
//               : s.reservation?.status === "예약"
//               ? "예약"
//               : s.reservation?.status === "미입실"
//               ? "미입실"
//               : s.absence
//               ? "사유제출"
//               : "미신청",
//             s.absence?.reason || "",
//           ].join(",")
//         ),
//       ].join("\n");

//       const blob = new Blob(["\uFEFF" + csv], {
//         type: "text/csv;charset=utf-8;",
//       });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `출결조회_${queryDate}_${queryGrade}학년.csv`;
//       link.click();
//       alert("출결 보고서가 다운로드되었습니다.");
//     };

//     const isMobile = window.innerWidth < 768;

//     return (
//       <div style={{ padding: "15px", maxWidth: "1400px", margin: "0 auto" }}>
//         <h1
//           style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}
//         >
//           출결 조회
//         </h1>

//         <div
//           style={{
//             display: "flex",
//             flexDirection: isMobile ? "column" : "row",
//             gap: "10px",
//             marginBottom: "20px",
//             alignItems: "stretch",
//           }}
//         >
//           <input
//             type="date"
//             value={queryDate}
//             onChange={(e) => setQueryDate(e.target.value)}
//             style={{
//               padding: "12px",
//               border: "2px solid #ddd",
//               borderRadius: "8px",
//               fontSize: "14px",
//               flex: isMobile ? "1" : "auto",
//             }}
//           />
//           <select
//             value={queryGrade}
//             onChange={(e) => setQueryGrade(Number(e.target.value))}
//             style={{
//               padding: "12px",
//               border: "2px solid #ddd",
//               borderRadius: "8px",
//               fontSize: "14px",
//               flex: isMobile ? "1" : "auto",
//             }}
//           >
//             <option value={2}>2학년</option>
//             <option value={3}>3학년</option>
//           </select>
//           <button
//             onClick={downloadReport}
//             style={{
//               padding: "12px 20px",
//               background: "#3B82F6",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               fontWeight: "bold",
//               fontSize: "14px",
//               flex: isMobile ? "1" : "auto",
//             }}
//           >
//             📥 다운로드
//           </button>
//         </div>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
//             gap: "15px",
//             marginBottom: "20px",
//           }}
//         >
//           {[1, 2, 3, 4].map((classNum) => {
//             const classData = dateData.filter((s) => s.class === classNum);
//             return (
//               <div
//                 key={classNum}
//                 style={{
//                   border: "2px solid #ddd",
//                   borderRadius: "12px",
//                   padding: "15px",
//                 }}
//               >
//                 <h3
//                   style={{
//                     fontSize: "16px",
//                     fontWeight: "bold",
//                     marginBottom: "12px",
//                   }}
//                 >
//                   {queryGrade}학년 {classNum}반
//                 </h3>
//                 <div style={{ maxHeight: "300px", overflowY: "auto" }}>
//                   {classData.map((s) => (
//                     <div
//                       key={s.id}
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         padding: "8px 0",
//                         borderBottom: "1px solid #E5E7EB",
//                         fontSize: "14px",
//                       }}
//                     >
//                       <span>
//                         {s.number}. {s.name}
//                       </span>
//                       <span
//                         style={{
//                           fontSize: "12px",
//                           padding: "3px 8px",
//                           borderRadius: "4px",
//                           fontWeight: "bold",
//                           whiteSpace: "nowrap",
//                           background:
//                             s.reservation?.status === "입실완료"
//                               ? "#D1FAE5"
//                               : s.reservation?.status === "예약"
//                               ? "#FEF3C7"
//                               : s.reservation?.status === "미입실"
//                               ? "#FEE2E2"
//                               : s.absence
//                               ? "#DBEAFE"
//                               : "#F3F4F6",
//                         }}
//                       >
//                         {s.reservation?.status === "입실완료"
//                           ? "출석"
//                           : s.reservation?.status === "예약"
//                           ? "예약"
//                           : s.reservation?.status === "미입실"
//                           ? "미입실"
//                           : s.absence?.reason || "미신청"}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         <div
//           style={{
//             background: "#F3F4F6",
//             padding: "15px",
//             borderRadius: "12px",
//           }}
//         >
//           <h3
//             style={{
//               fontSize: "16px",
//               fontWeight: "bold",
//               marginBottom: "12px",
//             }}
//           >
//             통계 ({queryDate})
//           </h3>
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: isMobile
//                 ? "repeat(2, 1fr)"
//                 : "repeat(5, 1fr)",
//               gap: "15px",
//               fontSize: "14px",
//             }}
//           >
//             <div>
//               <span style={{ color: "#666" }}>전체: </span>
//               <span style={{ fontWeight: "bold", fontSize: "18px" }}>
//                 {dateStats.total}명
//               </span>
//             </div>
//             <div>
//               <span style={{ color: "#666" }}>출석: </span>
//               <span
//                 style={{
//                   fontWeight: "bold",
//                   fontSize: "18px",
//                   color: "#10B981",
//                 }}
//               >
//                 {dateStats.checkedIn}명
//               </span>
//             </div>
//             <div>
//               <span style={{ color: "#666" }}>예약: </span>
//               <span
//                 style={{
//                   fontWeight: "bold",
//                   fontSize: "18px",
//                   color: "#F59E0B",
//                 }}
//               >
//                 {dateStats.reserved}명
//               </span>
//             </div>
//             <div>
//               <span style={{ color: "#666" }}>미입실: </span>
//               <span
//                 style={{
//                   fontWeight: "bold",
//                   fontSize: "18px",
//                   color: "#EF4444",
//                 }}
//               >
//                 {dateStats.noShow}명
//               </span>
//             </div>
//             <div>
//               <span style={{ color: "#666" }}>사유: </span>
//               <span
//                 style={{
//                   fontWeight: "bold",
//                   fontSize: "18px",
//                   color: "#3B82F6",
//                 }}
//               >
//                 {dateStats.absent}명
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // 교사 관리 페이지
//   const TeacherView = () => {
//     const [selectedGrade, setSelectedGrade] = useState(2);
//     const [selectedClass, setSelectedClass] = useState(1);
//     const [absenceData, setAbsenceData] = useState<{
//       [key: string]: { reason: string; note: string };
//     }>({});

//     if (!loggedInUser || loggedInUser.role !== "teacher") {
//       return (
//         <div style={{ padding: "20px", textAlign: "center" }}>
//           <p>교사 로그인이 필요합니다.</p>
//         </div>
//       );
//     }

//     const classStudents = students.filter(
//       (s) => s.grade === selectedGrade && s.class === selectedClass
//     );

//     const studentsWithStatus = classStudents.map((s) => {
//       const reservation = reservations.find(
//         (r) => r.student_id === s.id && r.date === currentDate
//       );
//       const absence = absences.find(
//         (a) => a.student_id === s.id && a.date === currentDate
//       );
//       return {
//         ...s,
//         reservation,
//         absence,
//         hasReservation: !!reservation,
//         isNoShow: reservation?.status === "미입실",
//         hasAbsence: !!absence,
//       };
//     });

//     const handleSaveAll = async () => {
//       try {
//         const newAbsences = Object.entries(absenceData)
//           .filter(([_, data]) => data.reason)
//           .map(([studentId, data]) => ({
//             student_id: studentId,
//             date: currentDate,
//             reason: data.reason,
//             note: data.note || "",
//           }));

//         if (newAbsences.length === 0) {
//           alert("입력된 사유가 없습니다.");
//           return;
//         }

//         const studentIds = newAbsences.map((a) => a.student_id);
//         await supabase
//           .from("absences")
//           .delete()
//           .in("student_id", studentIds)
//           .eq("date", currentDate);

//         const { error } = await supabase.from("absences").insert(newAbsences);

//         if (error) throw error;

//         alert(`${newAbsences.length}명의 사유가 저장되었습니다.`);
//         setAbsenceData({});
//         await loadData();
//       } catch (error) {
//         console.error("사유 저장 오류:", error);
//         alert("사유 저장에 실패했습니다.");
//       }
//     };

//     const handleNoShowCheck = async () => {
//       try {
//         const reservationsToUpdate = reservations
//           .filter((r) => r.date === currentDate && r.status === "예약")
//           .map((r) => r.id);

//         if (reservationsToUpdate.length > 0) {
//           const { error: updateError } = await supabase
//             .from("reservations")
//             .update({ status: "미입실" })
//             .in("id", reservationsToUpdate);

//           if (updateError) throw updateError;
//         }

//         const studentsToAdd = classStudents.filter((s) => {
//           const hasReservation = reservations.find(
//             (r) => r.student_id === s.id && r.date === currentDate
//           );
//           const hasAbsence = absences.find(
//             (a) => a.student_id === s.id && a.date === currentDate
//           );
//           return !hasReservation && !hasAbsence;
//         });

//         if (studentsToAdd.length > 0) {
//           const newReservations = studentsToAdd.map((s) => ({
//             student_id: s.id,
//             seat_id: null,
//             date: currentDate,
//             status: "미입실",
//             check_in_time: null,
//           }));

//           const { error: insertError } = await supabase
//             .from("reservations")
//             .insert(newReservations);

//           if (insertError) throw insertError;
//         }

//         alert("미입실 일괄 체크가 완료되었습니다.");
//         await loadData();
//       } catch (error) {
//         console.error("미입실 체크 오류:", error);
//         alert("미입실 체크에 실패했습니다.");
//       }
//     };

//     const isMobile = window.innerWidth < 768;

//     return (
//       <div style={{ padding: "15px", maxWidth: "1400px", margin: "0 auto" }}>
//         <h1
//           style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}
//         >
//           교사 관리 페이지
//         </h1>

//         <div
//           style={{
//             display: "flex",
//             flexDirection: isMobile ? "column" : "row",
//             gap: "10px",
//             marginBottom: "20px",
//           }}
//         >
//           <select
//             value={selectedGrade}
//             onChange={(e) => setSelectedGrade(Number(e.target.value))}
//             style={{
//               padding: "12px",
//               border: "2px solid #ddd",
//               borderRadius: "8px",
//               fontSize: "14px",
//               flex: "1",
//             }}
//           >
//             <option value={2}>2학년</option>
//             <option value={3}>3학년</option>
//           </select>
//           <select
//             value={selectedClass}
//             onChange={(e) => setSelectedClass(Number(e.target.value))}
//             style={{
//               padding: "12px",
//               border: "2px solid #ddd",
//               borderRadius: "8px",
//               fontSize: "14px",
//               flex: "1",
//             }}
//           >
//             <option value={1}>1반</option>
//             <option value={2}>2반</option>
//             <option value={3}>3반</option>
//             <option value={4}>4반</option>
//           </select>
//         </div>

//         <div
//           style={{
//             border: "2px solid #ddd",
//             borderRadius: "12px",
//             padding: "15px",
//             marginBottom: "20px",
//           }}
//         >
//           <h3
//             style={{
//               fontSize: "16px",
//               fontWeight: "bold",
//               marginBottom: "15px",
//             }}
//           >
//             {selectedGrade}학년 {selectedClass}반 ({classStudents.length}명)
//           </h3>

//           <div style={{ marginBottom: "15px" }}>
//             {studentsWithStatus.map((s) => {
//               const bgColor =
//                 s.reservation?.status === "입실완료"
//                   ? "#D1FAE5"
//                   : s.isNoShow
//                   ? "#FEE2E2"
//                   : !s.hasReservation && !s.hasAbsence
//                   ? "#FED7AA"
//                   : s.hasAbsence
//                   ? "#DBEAFE"
//                   : "#FEF3C7";

//               const currentReason =
//                 absenceData[s.id]?.reason || s.absence?.reason || "";
//               const currentNote =
//                 absenceData[s.id]?.note || s.absence?.note || "";

//               const canEditReason =
//                 s.reservation?.status !== "입실완료" &&
//                 s.reservation?.status !== "예약";

//               return (
//                 <div
//                   key={s.id}
//                   style={{
//                     display: "flex",
//                     flexDirection: isMobile ? "column" : "row",
//                     alignItems: isMobile ? "stretch" : "center",
//                     gap: isMobile ? "10px" : "12px",
//                     padding: "12px",
//                     background: bgColor,
//                     borderRadius: "8px",
//                     marginBottom: "8px",
//                     opacity: canEditReason ? 1 : 0.6,
//                   }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       minWidth: isMobile ? "100%" : "180px",
//                     }}
//                   >
//                     <span style={{ fontWeight: "bold", fontSize: "14px" }}>
//                       {s.number}번 {s.name}
//                     </span>
//                     <span
//                       style={{
//                         fontSize: "11px",
//                         padding: "3px 8px",
//                         borderRadius: "4px",
//                         background: "white",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       {s.reservation?.status === "입실완료"
//                         ? "✓ 입실"
//                         : s.isNoShow
//                         ? "⚠ 미입실"
//                         : s.hasReservation
//                         ? "예약"
//                         : "미예약"}
//                     </span>
//                   </div>

//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: isMobile
//                         ? "repeat(2, 1fr)"
//                         : "repeat(4, 1fr)",
//                       gap: "6px",
//                       flex: "1",
//                     }}
//                   >
//                     {["기숙사", "교내", "교외", "기타"].map((reason) => (
//                       <button
//                         key={reason}
//                         onClick={() => {
//                           if (!canEditReason) return;
//                           if (currentReason === reason) {
//                             const newData = { ...absenceData };
//                             delete newData[s.id];
//                             setAbsenceData(newData);
//                           } else {
//                             setAbsenceData({
//                               ...absenceData,
//                               [s.id]: {
//                                 reason,
//                                 note: currentNote,
//                               },
//                             });
//                           }
//                         }}
//                         disabled={!canEditReason}
//                         style={{
//                           padding: "8px 12px",
//                           borderRadius: "6px",
//                           fontSize: "13px",
//                           border:
//                             currentReason === reason
//                               ? "none"
//                               : "1px solid #ddd",
//                           background:
//                             currentReason === reason ? "#3B82F6" : "white",
//                           color:
//                             currentReason === reason
//                               ? "white"
//                               : canEditReason
//                               ? "black"
//                               : "#ccc",
//                           cursor: canEditReason ? "pointer" : "not-allowed",
//                           fontWeight:
//                             currentReason === reason ? "bold" : "normal",
//                         }}
//                       >
//                         {reason}
//                       </button>
//                     ))}
//                   </div>

//                   <input
//                     type="text"
//                     value={currentNote}
//                     onChange={(e) => {
//                       if (!canEditReason) return;
//                       setAbsenceData({
//                         ...absenceData,
//                         [s.id]: {
//                           reason: currentReason,
//                           note: e.target.value,
//                         },
//                       });
//                     }}
//                     onCompositionStart={() => setIsComposing(true)}
//                     onCompositionEnd={() => setIsComposing(false)}
//                     disabled={!canEditReason}
//                     placeholder={canEditReason ? "상세 사유" : ""}
//                     style={{
//                       flex: isMobile ? "1" : "0 0 150px",
//                       padding: "8px 10px",
//                       border: "1px solid #ddd",
//                       borderRadius: "6px",
//                       fontSize: "13px",
//                       background: canEditReason ? "white" : "#f5f5f5",
//                       cursor: canEditReason ? "text" : "not-allowed",
//                     }}
//                   />
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         <div
//           style={{
//             display: "flex",
//             flexDirection: isMobile ? "column" : "row",
//             gap: "12px",
//           }}
//         >
//           <button
//             onClick={handleSaveAll}
//             style={{
//               flex: "1",
//               padding: "15px",
//               background: "#3B82F6",
//               color: "white",
//               border: "none",
//               borderRadius: "10px",
//               fontSize: "16px",
//               fontWeight: "bold",
//               cursor: "pointer",
//             }}
//           >
//             일괄 저장 (
//             {
//               Object.keys(absenceData).filter((k) => absenceData[k]?.reason)
//                 .length
//             }
//             건)
//           </button>
//           <button
//             onClick={handleNoShowCheck}
//             style={{
//               padding: "15px 25px",
//               background: "#EF4444",
//               color: "white",
//               border: "none",
//               borderRadius: "10px",
//               fontSize: "16px",
//               fontWeight: "bold",
//               cursor: "pointer",
//             }}
//           >
//             미입실 체크
//           </button>
//         </div>

//         <div
//           style={{
//             marginTop: "20px",
//             padding: "15px",
//             background: "#F3F4F6",
//             borderRadius: "10px",
//           }}
//         >
//           <p
//             style={{
//               fontWeight: "bold",
//               marginBottom: "10px",
//               fontSize: "14px",
//             }}
//           >
//             💡 색상 안내:
//           </p>
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: isMobile
//                 ? "repeat(2, 1fr)"
//                 : "repeat(5, 1fr)",
//               gap: "10px",
//               fontSize: "13px",
//             }}
//           >
//             {[
//               { color: "#D1FAE5", label: "입실완료" },
//               { color: "#FEF3C7", label: "예약중" },
//               { color: "#FEE2E2", label: "미입실" },
//               { color: "#FED7AA", label: "미예약" },
//               { color: "#DBEAFE", label: "사유입력" },
//             ].map((item) => (
//               <div
//                 key={item.label}
//                 style={{ display: "flex", alignItems: "center", gap: "6px" }}
//               >
//                 <div
//                   style={{
//                     width: "18px",
//                     height: "18px",
//                     background: item.color,
//                     border: "1px solid #ddd",
//                     borderRadius: "4px",
//                     flexShrink: 0,
//                   }}
//                 ></div>
//                 <span>{item.label}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const addReservation = async (studentId: string, seatId: string) => {
//     const existing = reservations.find(
//       (r) => r.student_id === studentId && r.date === currentDate
//     );
//     if (existing) {
//       alert("이미 오늘 예약이 있습니다.");
//       return false;
//     }

//     try {
//       const { data, error } = await supabase
//         .from("reservations")
//         .insert([
//           {
//             student_id: studentId,
//             seat_id: seatId,
//             date: currentDate,
//             status: "예약",
//             check_in_time: null,
//           },
//         ])
//         .select();

//       if (error) throw error;
//       if (data) {
//         setReservations([...reservations, data[0]]);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error("예약 오류:", error);
//       alert("예약에 실패했습니다.");
//       return false;
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
//           setReservations(
//             reservations.map((r) => (r.id === reservation.id ? data[0] : r))
//           );
//           alert(`${student.name} 입실 완료!`);
//           await loadData();
//         }
//       } catch (error) {
//         console.error("입실 오류:", error);
//         alert("입실 처리에 실패했습니다.");
//       }
//     } else {
//       const availableSeats = seats.filter(
//         (s) =>
//           s.grade === student.grade &&
//           !reservations.find(
//             (r) => r.seat_id === s.id && r.date === currentDate
//           )
//       );

//       if (availableSeats.length === 0) {
//         alert("남은 좌석이 없습니다.");
//         return;
//       }

//       const seat = availableSeats[0];
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
//           .insert([
//             {
//               student_id: student.id,
//               seat_id: seat.id,
//               date: currentDate,
//               status: "입실완료",
//               check_in_time: checkInTime,
//             },
//           ])
//           .select();

//         if (error) throw error;
//         if (data) {
//           setReservations([...reservations, data[0]]);
//           alert(
//             `${student.name} 입실 완료! (좌석: ${seat.type} ${seat.number}번)`
//           );
//           await loadData();
//         }
//       } catch (error) {
//         console.error("입실 오류:", error);
//         alert("입실 처리에 실패했습니다.");
//       }
//     }
//   };

//   const getStats = (date: string = currentDate) => {
//     const todayReservations = reservations.filter((r) => r.date === date);
//     return {
//       total: students.length,
//       reserved: todayReservations.filter((r) => r.status === "예약").length,
//       checkedIn: todayReservations.filter((r) => r.status === "입실완료")
//         .length,
//       noShow: todayReservations.filter((r) => r.status === "미입실").length,
//       absent: absences.filter((a) => a.date === date).length,
//     };
//   };

//   const stats = getStats();

//   // 학생 예약 페이지
//   const StudentReservationView = () => {
//     const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

//     if (!loggedInStudent) {
//       return (
//         <div style={{ padding: "20px", textAlign: "center" }}>
//           <p style={{ fontSize: "14px" }}>로그인이 필요합니다.</p>
//           <button
//             onClick={() => setShowLogin(true)}
//             style={{
//               marginTop: "15px",
//               padding: "12px 25px",
//               background: "#3B82F6",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               fontSize: "14px",
//             }}
//           >
//             로그인하기
//           </button>
//         </div>
//       );
//     }

//     const myReservation = reservations.find(
//       (r) => r.student_id === loggedInStudent.id && r.date === currentDate
//     );

//     const availableSeats = seats.filter(
//       (s) =>
//         s.grade === loggedInStudent.grade &&
//         !reservations.find((r) => r.seat_id === s.id && r.date === currentDate)
//     );

//     const handleReservation = async () => {
//       if (!selectedSeat) {
//         alert("좌석을 선택해주세요.");
//         return;
//       }

//       const success = await addReservation(loggedInStudent.id, selectedSeat.id);
//       if (success) {
//         alert("예약이 완료되었습니다!");
//         setSelectedSeat(null);
//         await loadData();
//       }
//     };

//     const handleCancelReservation = async () => {
//       if (!myReservation) return;

//       if (!window.confirm("예약을 취소하시겠습니까?")) return;

//       try {
//         const { error } = await supabase
//           .from("reservations")
//           .delete()
//           .eq("id", myReservation.id);

//         if (error) throw error;

//         alert("예약이 취소되었습니다.");
//         await loadData();
//       } catch (error) {
//         console.error("예약 취소 오류:", error);
//         alert("예약 취소에 실패했습니다.");
//       }
//     };

//     const isMobile = window.innerWidth < 768;

//     return (
//       <div style={{ padding: "15px", maxWidth: "1000px", margin: "0 auto" }}>
//         <div
//           style={{
//             background: "#EFF6FF",
//             padding: "15px",
//             borderRadius: "12px",
//             marginBottom: "20px",
//           }}
//         >
//           <h2
//             style={{
//               fontSize: "18px",
//               fontWeight: "bold",
//               marginBottom: "8px",
//             }}
//           >
//             {loggedInStudent.grade}학년 {loggedInStudent.class}반{" "}
//             {loggedInStudent.number}번
//           </h2>
//           <p
//             style={{
//               fontSize: "20px",
//               fontWeight: "bold",
//               color: "#3B82F6",
//               margin: 0,
//             }}
//           >
//             {loggedInStudent.name}
//           </p>
//           <p style={{ color: "#666", fontSize: "13px", marginTop: "5px" }}>
//             자율학습 좌석 예약
//           </p>
//         </div>

//         {myReservation ? (
//           <div
//             style={{
//               background:
//                 myReservation.status === "입실완료" ? "#D1FAE5" : "#FEF3C7",
//               padding: "20px",
//               borderRadius: "12px",
//               marginBottom: "20px",
//             }}
//           >
//             <h3
//               style={{
//                 fontSize: "18px",
//                 fontWeight: "bold",
//                 marginBottom: "15px",
//               }}
//             >
//               ✓ 예약 완료
//             </h3>
//             <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
//               <p>
//                 <strong>좌석:</strong>{" "}
//                 {seats.find((s) => s.id === myReservation.seat_id)?.type}{" "}
//                 {seats.find((s) => s.id === myReservation.seat_id)?.number}번
//               </p>
//               <p>
//                 <strong>상태:</strong>{" "}
//                 <span
//                   style={{
//                     padding: "4px 12px",
//                     borderRadius: "4px",
//                     background:
//                       myReservation.status === "입실완료"
//                         ? "#10B981"
//                         : "#F59E0B",
//                     color: "white",
//                     fontSize: "14px",
//                   }}
//                 >
//                   {myReservation.status}
//                 </span>
//               </p>
//               {myReservation.check_in_time && (
//                 <p>
//                   <strong>입실시간:</strong> {myReservation.check_in_time}
//                 </p>
//               )}
//             </div>

//             {myReservation.status !== "입실완료" && (
//               <button
//                 onClick={handleCancelReservation}
//                 style={{
//                   marginTop: "15px",
//                   padding: "12px 24px",
//                   background: "#EF4444",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "8px",
//                   cursor: "pointer",
//                   fontSize: "15px",
//                   fontWeight: "bold",
//                   width: isMobile ? "100%" : "auto",
//                 }}
//               >
//                 예약 취소
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             <h3
//               style={{
//                 fontSize: "17px",
//                 fontWeight: "bold",
//                 marginBottom: "15px",
//               }}
//             >
//               사용 가능한 좌석 ({availableSeats.length}석)
//             </h3>

//             <div style={{ display: "grid", gap: "15px" }}>
//               {loggedInStudent.grade === 3 && (
//                 <div
//                   style={{
//                     border: "2px solid #ddd",
//                     borderRadius: "12px",
//                     padding: "15px",
//                   }}
//                 >
//                   <h4
//                     style={{
//                       fontSize: "16px",
//                       fontWeight: "bold",
//                       marginBottom: "12px",
//                     }}
//                   >
//                     A그룹 - 3학년석
//                   </h4>
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: isMobile
//                         ? "repeat(5, 1fr)"
//                         : "repeat(7, 1fr)",
//                       gap: "8px",
//                     }}
//                   >
//                     {availableSeats
//                       .filter((s) => s.group === "A")
//                       .map((seat) => (
//                         <button
//                           key={seat.id}
//                           onClick={() => setSelectedSeat(seat)}
//                           style={{
//                             padding: isMobile ? "15px 10px" : "18px",
//                             fontSize: isMobile ? "14px" : "16px",
//                             fontWeight: "bold",
//                             border:
//                               selectedSeat?.id === seat.id
//                                 ? "3px solid #3B82F6"
//                                 : "2px solid #ddd",
//                             borderRadius: "8px",
//                             background:
//                               selectedSeat?.id === seat.id
//                                 ? "#3B82F6"
//                                 : "white",
//                             color:
//                               selectedSeat?.id === seat.id ? "white" : "black",
//                             cursor: "pointer",
//                             transition: "all 0.2s",
//                           }}
//                         >
//                           {seat.number}
//                         </button>
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {loggedInStudent.grade === 2 && (
//                 <>
//                   <div
//                     style={{
//                       border: "2px solid #ddd",
//                       borderRadius: "12px",
//                       padding: "15px",
//                     }}
//                   >
//                     <h4
//                       style={{
//                         fontSize: "16px",
//                         fontWeight: "bold",
//                         marginBottom: "12px",
//                       }}
//                     >
//                       B그룹 - 2학년 폐쇄형
//                     </h4>
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns: isMobile
//                           ? "repeat(5, 1fr)"
//                           : "repeat(7, 1fr)",
//                         gap: "8px",
//                       }}
//                     >
//                       {availableSeats
//                         .filter((s) => s.group === "B")
//                         .map((seat) => (
//                           <button
//                             key={seat.id}
//                             onClick={() => setSelectedSeat(seat)}
//                             style={{
//                               padding: isMobile ? "12px 8px" : "15px",
//                               fontSize: isMobile ? "13px" : "14px",
//                               fontWeight: "bold",
//                               border:
//                                 selectedSeat?.id === seat.id
//                                   ? "3px solid #3B82F6"
//                                   : "2px solid #ddd",
//                               borderRadius: "8px",
//                               background:
//                                 selectedSeat?.id === seat.id
//                                   ? "#3B82F6"
//                                   : "white",
//                               color:
//                                 selectedSeat?.id === seat.id
//                                   ? "white"
//                                   : "black",
//                               cursor: "pointer",
//                             }}
//                           >
//                             {seat.number}
//                           </button>
//                         ))}
//                     </div>
//                   </div>

//                   <div
//                     style={{
//                       border: "2px solid #ddd",
//                       borderRadius: "12px",
//                       padding: "15px",
//                     }}
//                   >
//                     <h4
//                       style={{
//                         fontSize: "16px",
//                         fontWeight: "bold",
//                         marginBottom: "12px",
//                       }}
//                     >
//                       C그룹 - 2학년 폐쇄형
//                     </h4>
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns: isMobile
//                           ? "repeat(5, 1fr)"
//                           : "repeat(7, 1fr)",
//                         gap: "8px",
//                       }}
//                     >
//                       {availableSeats
//                         .filter((s) => s.group === "C")
//                         .map((seat) => (
//                           <button
//                             key={seat.id}
//                             onClick={() => setSelectedSeat(seat)}
//                             style={{
//                               padding: isMobile ? "12px 8px" : "15px",
//                               fontSize: isMobile ? "13px" : "14px",
//                               fontWeight: "bold",
//                               border:
//                                 selectedSeat?.id === seat.id
//                                   ? "3px solid #3B82F6"
//                                   : "2px solid #ddd",
//                               borderRadius: "8px",
//                               background:
//                                 selectedSeat?.id === seat.id
//                                   ? "#3B82F6"
//                                   : "white",
//                               color:
//                                 selectedSeat?.id === seat.id
//                                   ? "white"
//                                   : "black",
//                               cursor: "pointer",
//                             }}
//                           >
//                             {seat.number}
//                           </button>
//                         ))}
//                     </div>
//                   </div>

//                   <div
//                     style={{
//                       border: "2px solid #ddd",
//                       borderRadius: "12px",
//                       padding: "15px",
//                     }}
//                   >
//                     <h4
//                       style={{
//                         fontSize: "16px",
//                         fontWeight: "bold",
//                         marginBottom: "12px",
//                       }}
//                     >
//                       D그룹 - 2학년 오픈형
//                     </h4>
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns: isMobile
//                           ? "repeat(6, 1fr)"
//                           : "repeat(8, 1fr)",
//                         gap: "8px",
//                       }}
//                     >
//                       {availableSeats
//                         .filter((s) => s.group === "D")
//                         .map((seat) => (
//                           <button
//                             key={seat.id}
//                             onClick={() => setSelectedSeat(seat)}
//                             style={{
//                               padding: isMobile ? "12px 8px" : "15px",
//                               fontSize: isMobile ? "13px" : "14px",
//                               fontWeight: "bold",
//                               border:
//                                 selectedSeat?.id === seat.id
//                                   ? "3px solid #3B82F6"
//                                   : "2px solid #ddd",
//                               borderRadius: "8px",
//                               background:
//                                 selectedSeat?.id === seat.id
//                                   ? "#3B82F6"
//                                   : "white",
//                               color:
//                                 selectedSeat?.id === seat.id
//                                   ? "white"
//                                   : "black",
//                               cursor: "pointer",
//                             }}
//                           >
//                             {seat.number}
//                           </button>
//                         ))}
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>

//             {selectedSeat && (
//               <button
//                 onClick={handleReservation}
//                 style={{
//                   marginTop: "20px",
//                   width: "100%",
//                   padding: "18px",
//                   background: "#3B82F6",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "12px",
//                   fontSize: "17px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                 }}
//               >
//                 {selectedSeat.type} {selectedSeat.number}번 예약하기
//               </button>
//             )}
//           </>
//         )}
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//           fontSize: "18px",
//         }}
//       >
//         데이터 로딩중...
//       </div>
//     );
//   }

//   // 로그인 화면
//   const LoginView = () => {
//     const isMobile = window.innerWidth < 768;

//     return (
//       <div
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           background: "rgba(0,0,0,0.5)",
//           display: "flex",
//           alignItems: isMobile ? "center" : "flex-start",
//           justifyContent: isMobile ? "center" : "flex-end",
//           zIndex: 1000,
//           padding: "0",
//           overflow: "auto",
//         }}
//         onClick={(e) => {
//           if (e.target === e.currentTarget) {
//             setShowLogin(false);
//           }
//         }}
//       >
//         <div
//           style={{
//             background: "white",
//             borderRadius: isMobile ? "16px" : "0",
//             padding: "25px 20px",
//             maxWidth: isMobile ? "90%" : "400px",
//             width: "100%",
//             height: isMobile ? "auto" : "100vh",
//             maxHeight: isMobile ? "90vh" : "100vh",
//             overflow: "auto",
//             margin: isMobile ? "15px" : "0",
//             boxShadow: isMobile
//               ? "0 4px 6px rgba(0,0,0,0.1)"
//               : "-2px 0 8px rgba(0,0,0,0.1)",
//           }}
//         >
//           <h2
//             style={{
//               marginBottom: "20px",
//               textAlign: "center",
//               fontSize: "22px",
//             }}
//           >
//             로그인
//           </h2>

//           {/* 로그인 유형 선택 */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: "8px",
//               marginBottom: "20px",
//             }}
//           >
//             <button
//               onClick={() => setLoginType("student")}
//               style={{
//                 padding: "12px 8px",
//                 border:
//                   loginType === "student"
//                     ? "2px solid #3B82F6"
//                     : "1px solid #ddd",
//                 borderRadius: "8px",
//                 background: loginType === "student" ? "#EFF6FF" : "white",
//                 fontWeight: loginType === "student" ? "bold" : "normal",
//                 cursor: "pointer",
//                 fontSize: "14px",
//               }}
//             >
//               학생
//             </button>
//             <button
//               onClick={() => setLoginType("teacher")}
//               style={{
//                 padding: "12px 8px",
//                 border:
//                   loginType === "teacher"
//                     ? "2px solid #3B82F6"
//                     : "1px solid #ddd",
//                 borderRadius: "8px",
//                 background: loginType === "teacher" ? "#EFF6FF" : "white",
//                 fontWeight: loginType === "teacher" ? "bold" : "normal",
//                 cursor: "pointer",
//                 fontSize: "14px",
//               }}
//             >
//               교사
//             </button>
//             <button
//               onClick={() => setLoginType("admin")}
//               style={{
//                 padding: "12px 8px",
//                 border:
//                   loginType === "admin"
//                     ? "2px solid #3B82F6"
//                     : "1px solid #ddd",
//                 borderRadius: "8px",
//                 background: loginType === "admin" ? "#EFF6FF" : "white",
//                 fontWeight: loginType === "admin" ? "bold" : "normal",
//                 cursor: "pointer",
//                 fontSize: "14px",
//               }}
//             >
//               관리자
//             </button>
//           </div>

//           {/* 학생 로그인 폼 */}
//           {loginType === "student" && (
//             <>
//               <div style={{ marginBottom: "20px" }}>
//                 <label
//                   style={{
//                     display: "block",
//                     marginBottom: "10px",
//                     fontWeight: "bold",
//                     fontSize: "14px",
//                   }}
//                 >
//                   방법 1: 학년/반/번호로 로그인
//                 </label>
//                 <div
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1fr 1fr",
//                     gap: "8px",
//                     marginBottom: "12px",
//                   }}
//                 >
//                   <select
//                     value={loginForm.grade}
//                     onChange={(e) =>
//                       setLoginForm({
//                         ...loginForm,
//                         grade: Number(e.target.value),
//                       })
//                     }
//                     style={{
//                       padding: "10px 8px",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                       fontSize: "14px",
//                     }}
//                   >
//                     <option value={2}>2학년</option>
//                     <option value={3}>3학년</option>
//                   </select>
//                   <select
//                     value={loginForm.class}
//                     onChange={(e) =>
//                       setLoginForm({
//                         ...loginForm,
//                         class: Number(e.target.value),
//                       })
//                     }
//                     style={{
//                       padding: "10px 8px",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                       fontSize: "14px",
//                     }}
//                   >
//                     <option value={1}>1반</option>
//                     <option value={2}>2반</option>
//                     <option value={3}>3반</option>
//                     <option value={4}>4반</option>
//                   </select>
//                   <input
//                     type="number"
//                     placeholder="번호"
//                     value={loginForm.number}
//                     onChange={(e) =>
//                       setLoginForm({
//                         ...loginForm,
//                         number: Number(e.target.value),
//                       })
//                     }
//                     style={{
//                       padding: "10px 8px",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                       fontSize: "14px",
//                     }}
//                   />
//                 </div>
//                 <input
//                   type="password"
//                   placeholder="비밀번호 (생년월일 4자리)"
//                   value={loginForm.password}
//                   onChange={(e) =>
//                     setLoginForm({ ...loginForm, password: e.target.value })
//                   }
//                   onCompositionStart={() => setIsComposing(true)}
//                   onCompositionEnd={() => setIsComposing(false)}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter" && !isComposing) {
//                       handleLogin();
//                     }
//                   }}
//                   style={{
//                     width: "100%",
//                     padding: "12px",
//                     border: "1px solid #ddd",
//                     borderRadius: "8px",
//                     boxSizing: "border-box",
//                     fontSize: "14px",
//                   }}
//                 />
//                 <p
//                   style={{
//                     fontSize: "12px",
//                     color: "#666",
//                     marginTop: "8px",
//                     lineHeight: "1.4",
//                   }}
//                 >
//                   테스트: 2학년 1반 1번 / 비밀번호: 0101
//                 </p>
//               </div>

//               <button
//                 onClick={handleLogin}
//                 style={{
//                   width: "100%",
//                   padding: "14px",
//                   background: "#3B82F6",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "8px",
//                   fontWeight: "bold",
//                   fontSize: "16px",
//                   cursor: "pointer",
//                   marginBottom: "20px",
//                 }}
//               >
//                 로그인
//               </button>

//               <div
//                 style={{
//                   borderTop: "1px solid #ddd",
//                   paddingTop: "20px",
//                   marginTop: "20px",
//                 }}
//               >
//                 <label
//                   style={{
//                     display: "block",
//                     marginBottom: "10px",
//                     fontWeight: "bold",
//                     fontSize: "14px",
//                   }}
//                 >
//                   방법 2: 바코드로 로그인
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="학생증 바코드 스캔"
//                   value={loginForm.barcode}
//                   onChange={(e) =>
//                     setLoginForm({ ...loginForm, barcode: e.target.value })
//                   }
//                   onCompositionStart={() => setIsComposing(true)}
//                   onCompositionEnd={() => setIsComposing(false)}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter" && !isComposing) {
//                       handleBarcodeLogin();
//                     }
//                   }}
//                   style={{
//                     width: "100%",
//                     padding: "12px",
//                     border: "1px solid #ddd",
//                     borderRadius: "8px",
//                     marginBottom: "10px",
//                     boxSizing: "border-box",
//                     fontSize: "14px",
//                   }}
//                 />
//                 <button
//                   onClick={handleBarcodeLogin}
//                   style={{
//                     width: "100%",
//                     padding: "14px",
//                     background: "#10B981",
//                     color: "white",
//                     border: "none",
//                     borderRadius: "8px",
//                     fontWeight: "bold",
//                     fontSize: "16px",
//                     cursor: "pointer",
//                   }}
//                 >
//                   바코드 로그인
//                 </button>
//               </div>
//             </>
//           )}

//           {/* 교사/관리자 로그인 폼 */}
//           {(loginType === "teacher" || loginType === "admin") && (
//             <>
//               <div style={{ marginBottom: "15px" }}>
//                 <label
//                   style={{
//                     display: "block",
//                     marginBottom: "8px",
//                     fontWeight: "bold",
//                     fontSize: "14px",
//                   }}
//                 >
//                   이메일
//                 </label>
//                 <input
//                   type="email"
//                   placeholder={
//                     loginType === "admin"
//                       ? "admin@school.com"
//                       : "teacher@school.com"
//                   }
//                   value={loginForm.email}
//                   onChange={(e) =>
//                     setLoginForm({ ...loginForm, email: e.target.value })
//                   }
//                   onCompositionStart={() => setIsComposing(true)}
//                   onCompositionEnd={() => setIsComposing(false)}
//                   style={{
//                     width: "100%",
//                     padding: "12px",
//                     border: "1px solid #ddd",
//                     borderRadius: "8px",
//                     boxSizing: "border-box",
//                     fontSize: "14px",
//                   }}
//                 />
//               </div>
//               <div style={{ marginBottom: "15px" }}>
//                 <label
//                   style={{
//                     display: "block",
//                     marginBottom: "8px",
//                     fontWeight: "bold",
//                     fontSize: "14px",
//                   }}
//                 >
//                   비밀번호
//                 </label>
//                 <input
//                   type="password"
//                   placeholder="비밀번호"
//                   value={loginForm.password}
//                   onChange={(e) =>
//                     setLoginForm({ ...loginForm, password: e.target.value })
//                   }
//                   onCompositionStart={() => setIsComposing(true)}
//                   onCompositionEnd={() => setIsComposing(false)}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter" && !isComposing) {
//                       handleLogin();
//                     }
//                   }}
//                   style={{
//                     width: "100%",
//                     padding: "12px",
//                     border: "1px solid #ddd",
//                     borderRadius: "8px",
//                     boxSizing: "border-box",
//                     fontSize: "14px",
//                   }}
//                 />
//                 <p
//                   style={{
//                     fontSize: "12px",
//                     color: "#666",
//                     marginTop: "8px",
//                     lineHeight: "1.4",
//                   }}
//                 >
//                   테스트: {loginType === "admin" ? "admin1234" : "teacher1234"}
//                 </p>
//               </div>
//               <button
//                 onClick={handleLogin}
//                 style={{
//                   width: "100%",
//                   padding: "14px",
//                   background: "#3B82F6",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "8px",
//                   fontWeight: "bold",
//                   fontSize: "16px",
//                   cursor: "pointer",
//                 }}
//               >
//                 로그인
//               </button>
//             </>
//           )}

//           <button
//             onClick={() => setShowLogin(false)}
//             style={{
//               width: "100%",
//               padding: "12px",
//               marginTop: "15px",
//               background: "white",
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               cursor: "pointer",
//               fontSize: "14px",
//             }}
//           >
//             취소
//           </button>
//         </div>
//       </div>
//     );
//   };

//   // 간단한 대시보드 화면
//   const DashboardView = () => {
//     const isMobile = window.innerWidth < 768;

//     return (
//       <div style={{ padding: "15px" }}>
//         <h1 style={{ fontSize: "20px", marginBottom: "20px" }}>
//           자율학습실 실시간 현황
//         </h1>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
//             gap: "12px",
//             marginBottom: "25px",
//           }}
//         >
//           <div
//             style={{
//               background: "#DBEAFE",
//               padding: "15px",
//               borderRadius: "8px",
//             }}
//           >
//             <div style={{ fontSize: "12px", color: "#666" }}>전체 학생</div>
//             <div style={{ fontSize: "24px", fontWeight: "bold" }}>
//               {stats.total}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#FEF3C7",
//               padding: "15px",
//               borderRadius: "8px",
//             }}
//           >
//             <div style={{ fontSize: "12px", color: "#666" }}>예약</div>
//             <div style={{ fontSize: "24px", fontWeight: "bold" }}>
//               {stats.reserved}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#D1FAE5",
//               padding: "15px",
//               borderRadius: "8px",
//             }}
//           >
//             <div style={{ fontSize: "12px", color: "#666" }}>입실</div>
//             <div style={{ fontSize: "24px", fontWeight: "bold" }}>
//               {stats.checkedIn}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#FEE2E2",
//               padding: "15px",
//               borderRadius: "8px",
//             }}
//           >
//             <div style={{ fontSize: "12px", color: "#666" }}>미입실</div>
//             <div style={{ fontSize: "24px", fontWeight: "bold" }}>
//               {stats.noShow}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#F3F4F6",
//               padding: "15px",
//               borderRadius: "8px",
//             }}
//           >
//             <div style={{ fontSize: "12px", color: "#666" }}>사유제출</div>
//             <div style={{ fontSize: "24px", fontWeight: "bold" }}>
//               {stats.absent}명
//             </div>
//           </div>
//         </div>

//         <div
//           style={{
//             marginBottom: "15px",
//             border: "1px solid #ddd",
//             borderRadius: "8px",
//             padding: "15px",
//           }}
//         >
//           <h3
//             style={{
//               textAlign: "center",
//               marginBottom: "12px",
//               fontSize: "16px",
//             }}
//           >
//             좌석 배치도
//           </h3>
//           <img
//             src="https://raw.githubusercontent.com/skywind99/temp/refs/heads/main/anigo5f.PNG"
//             alt="좌석 배치도"
//             style={{
//               width: "100%",
//               maxWidth: "800px",
//               margin: "0 auto",
//               display: "block",
//             }}
//           />
//         </div>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
//             gap: "15px",
//             marginBottom: "15px",
//           }}
//         >
//           <div
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               padding: "15px",
//             }}
//           >
//             <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
//               A그룹 - 3학년 (31석)
//             </h3>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: isMobile
//                   ? "repeat(6, 1fr)"
//                   : "repeat(7, 1fr)",
//                 gap: "6px",
//               }}
//             >
//               {seats
//                 .filter((s) => s.group === "A")
//                 .map((seat) => {
//                   const reservation = reservations.find(
//                     (r) => r.seat_id === seat.id && r.date === currentDate
//                   );
//                   return (
//                     <div
//                       key={seat.id}
//                       style={{
//                         padding: "8px",
//                         textAlign: "center",
//                         borderRadius: "4px",
//                         fontSize: "13px",
//                         background:
//                           reservation?.status === "입실완료"
//                             ? "#D1FAE5"
//                             : reservation?.status === "예약"
//                             ? "#FEF3C7"
//                             : reservation?.status === "미입실"
//                             ? "#FEE2E2"
//                             : "#F3F4F6",
//                       }}
//                     >
//                       {seat.number}
//                     </div>
//                   );
//                 })}
//             </div>
//           </div>

//           <div
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               padding: "15px",
//             }}
//           >
//             <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
//               B그룹 - 2학년 폐쇄형 (39석)
//             </h3>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: isMobile
//                   ? "repeat(6, 1fr)"
//                   : "repeat(7, 1fr)",
//                 gap: "6px",
//               }}
//             >
//               {seats
//                 .filter((s) => s.group === "B")
//                 .map((seat) => {
//                   const reservation = reservations.find(
//                     (r) => r.seat_id === seat.id && r.date === currentDate
//                   );
//                   return (
//                     <div
//                       key={seat.id}
//                       style={{
//                         padding: "8px",
//                         textAlign: "center",
//                         borderRadius: "4px",
//                         fontSize: "13px",
//                         background:
//                           reservation?.status === "입실완료"
//                             ? "#D1FAE5"
//                             : reservation?.status === "예약"
//                             ? "#FEF3C7"
//                             : reservation?.status === "미입실"
//                             ? "#FEE2E2"
//                             : "#F3F4F6",
//                       }}
//                     >
//                       {seat.number}
//                     </div>
//                   );
//                 })}
//             </div>
//           </div>
//         </div>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
//             gap: "15px",
//           }}
//         >
//           <div
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               padding: "15px",
//             }}
//           >
//             <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
//               C그룹 - 2학년 폐쇄형 (26석)
//             </h3>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: isMobile
//                   ? "repeat(6, 1fr)"
//                   : "repeat(7, 1fr)",
//                 gap: "6px",
//               }}
//             >
//               {seats
//                 .filter((s) => s.group === "C")
//                 .map((seat) => {
//                   const reservation = reservations.find(
//                     (r) => r.seat_id === seat.id && r.date === currentDate
//                   );
//                   return (
//                     <div
//                       key={seat.id}
//                       style={{
//                         padding: "8px",
//                         textAlign: "center",
//                         borderRadius: "4px",
//                         fontSize: "13px",
//                         background:
//                           reservation?.status === "입실완료"
//                             ? "#D1FAE5"
//                             : reservation?.status === "예약"
//                             ? "#FEF3C7"
//                             : reservation?.status === "미입실"
//                             ? "#FEE2E2"
//                             : "#F3F4F6",
//                       }}
//                     >
//                       {seat.number}
//                     </div>
//                   );
//                 })}
//             </div>
//           </div>

//           <div
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               padding: "15px",
//             }}
//           >
//             <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
//               D그룹 - 2학년 오픈형 (32석)
//             </h3>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: isMobile
//                   ? "repeat(6, 1fr)"
//                   : "repeat(8, 1fr)",
//                 gap: "6px",
//               }}
//             >
//               {seats
//                 .filter((s) => s.group === "D")
//                 .map((seat) => {
//                   const reservation = reservations.find(
//                     (r) => r.seat_id === seat.id && r.date === currentDate
//                   );
//                   return (
//                     <div
//                       key={seat.id}
//                       style={{
//                         padding: "8px",
//                         textAlign: "center",
//                         borderRadius: "4px",
//                         fontSize: "13px",
//                         background:
//                           reservation?.status === "입실완료"
//                             ? "#D1FAE5"
//                             : reservation?.status === "예약"
//                             ? "#FEF3C7"
//                             : reservation?.status === "미입실"
//                             ? "#FEE2E2"
//                             : "#F3F4F6",
//                       }}
//                     >
//                       {seat.number}
//                     </div>
//                   );
//                 })}
//             </div>
//           </div>
//         </div>

//         <div
//           style={{
//             marginTop: "15px",
//             display: "flex",
//             gap: "8px",
//             alignItems: "center",
//             fontSize: "13px",
//             flexWrap: "wrap",
//           }}
//         >
//           {[
//             { bg: "#F3F4F6", label: "빈자리" },
//             { bg: "#FEF3C7", label: "예약" },
//             { bg: "#D1FAE5", label: "입실" },
//             { bg: "#FEE2E2", label: "미입실" },
//           ].map((item) => (
//             <div
//               key={item.label}
//               style={{ display: "flex", alignItems: "center", gap: "5px" }}
//             >
//               <div
//                 style={{
//                   width: "14px",
//                   height: "14px",
//                   background: item.bg,
//                   borderRadius: "2px",
//                   border: "1px solid #ddd",
//                 }}
//               ></div>
//               <span>{item.label}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // 키오스크 화면
//   const KioskView = () => {
//     const availableSeats = studentForSeatSelection
//       ? seats.filter(
//           (s) =>
//             s.grade === studentForSeatSelection.grade &&
//             !reservations.find(
//               (r) => r.seat_id === s.id && r.date === currentDate
//             )
//         )
//       : [];

//     const isMobile = window.innerWidth < 768;

//     if (selectingSeat && studentForSeatSelection) {
//       return (
//         <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
//           <h1
//             style={{
//               textAlign: "center",
//               marginBottom: "15px",
//               fontSize: "20px",
//             }}
//           >
//             {studentForSeatSelection.name} - 좌석 선택
//           </h1>
//           <p
//             style={{
//               textAlign: "center",
//               color: "#666",
//               marginBottom: "25px",
//               fontSize: "14px",
//             }}
//           >
//             원하는 좌석을 선택해주세요 (남은 좌석: {availableSeats.length}개)
//           </p>

//           <div style={{ display: "grid", gap: "15px" }}>
//             {studentForSeatSelection.grade === 3 && (
//               <div
//                 style={{
//                   border: "2px solid #ddd",
//                   borderRadius: "12px",
//                   padding: "15px",
//                 }}
//               >
//                 <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                   A그룹 - 3학년
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
//                     .filter((s) => s.group === "A")
//                     .map((seat) => (
//                       <button
//                         key={seat.id}
//                         onClick={() => completeSeatSelection(seat.id)}
//                         style={{
//                           padding: isMobile ? "15px" : "18px",
//                           fontSize: isMobile ? "16px" : "18px",
//                           fontWeight: "bold",
//                           border: "2px solid #3B82F6",
//                           borderRadius: "8px",
//                           background: "white",
//                           cursor: "pointer",
//                           transition: "all 0.2s",
//                         }}
//                       >
//                         {seat.number}
//                       </button>
//                     ))}
//                 </div>
//               </div>
//             )}

//             {studentForSeatSelection.grade === 2 && (
//               <>
//                 <div
//                   style={{
//                     border: "2px solid #ddd",
//                     borderRadius: "12px",
//                     padding: "15px",
//                   }}
//                 >
//                   <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                     B그룹 - 2학년 폐쇄형
//                   </h3>
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: isMobile
//                         ? "repeat(5, 1fr)"
//                         : "repeat(7, 1fr)",
//                       gap: "8px",
//                     }}
//                   >
//                     {availableSeats
//                       .filter((s) => s.group === "B")
//                       .map((seat) => (
//                         <button
//                           key={seat.id}
//                           onClick={() => completeSeatSelection(seat.id)}
//                           style={{
//                             padding: isMobile ? "12px" : "15px",
//                             fontSize: isMobile ? "14px" : "16px",
//                             fontWeight: "bold",
//                             border: "2px solid #3B82F6",
//                             borderRadius: "8px",
//                             background: "white",
//                             cursor: "pointer",
//                           }}
//                         >
//                           {seat.number}
//                         </button>
//                       ))}
//                   </div>
//                 </div>

//                 <div
//                   style={{
//                     border: "2px solid #ddd",
//                     borderRadius: "12px",
//                     padding: "15px",
//                   }}
//                 >
//                   <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                     C그룹 - 2학년 폐쇄형
//                   </h3>
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: isMobile
//                         ? "repeat(5, 1fr)"
//                         : "repeat(7, 1fr)",
//                       gap: "8px",
//                     }}
//                   >
//                     {availableSeats
//                       .filter((s) => s.group === "C")
//                       .map((seat) => (
//                         <button
//                           key={seat.id}
//                           onClick={() => completeSeatSelection(seat.id)}
//                           style={{
//                             padding: isMobile ? "12px" : "15px",
//                             fontSize: isMobile ? "14px" : "16px",
//                             fontWeight: "bold",
//                             border: "2px solid #3B82F6",
//                             borderRadius: "8px",
//                             background: "white",
//                             cursor: "pointer",
//                           }}
//                         >
//                           {seat.number}
//                         </button>
//                       ))}
//                   </div>
//                 </div>

//                 <div
//                   style={{
//                     border: "2px solid #ddd",
//                     borderRadius: "12px",
//                     padding: "15px",
//                   }}
//                 >
//                   <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
//                     D그룹 - 2학년 오픈형
//                   </h3>
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: isMobile
//                         ? "repeat(6, 1fr)"
//                         : "repeat(8, 1fr)",
//                       gap: "8px",
//                     }}
//                   >
//                     {availableSeats
//                       .filter((s) => s.group === "D")
//                       .map((seat) => (
//                         <button
//                           key={seat.id}
//                           onClick={() => completeSeatSelection(seat.id)}
//                           style={{
//                             padding: isMobile ? "12px" : "15px",
//                             fontSize: isMobile ? "14px" : "16px",
//                             fontWeight: "bold",
//                             border: "2px solid #3B82F6",
//                             borderRadius: "8px",
//                             background: "white",
//                             cursor: "pointer",
//                           }}
//                         >
//                           {seat.number}
//                         </button>
//                       ))}
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>

//           <button
//             onClick={() => {
//               setSelectingSeat(false);
//               setStudentForSeatSelection(null);
//             }}
//             style={{
//               marginTop: "20px",
//               width: "100%",
//               padding: "14px",
//               fontSize: "15px",
//               border: "2px solid #ddd",
//               borderRadius: "8px",
//               background: "white",
//               cursor: "pointer",
//             }}
//           >
//             취소
//           </button>
//         </div>
//       );
//     }

//     return (
//       <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
//         <h1
//           style={{
//             textAlign: "center",
//             marginBottom: "30px",
//             fontSize: "22px",
//           }}
//         >
//           자율학습실 입실
//         </h1>

//         <div
//           style={{
//             background: "#EFF6FF",
//             padding: "30px 20px",
//             borderRadius: "12px",
//             marginBottom: "25px",
//           }}
//         >
//           <p
//             style={{
//               textAlign: "center",
//               fontSize: "16px",
//               marginBottom: "15px",
//             }}
//           >
//             학생증을 스캔해주세요
//           </p>
//           <input
//             type="text"
//             value={barcodeInput}
//             onChange={(e) => setBarcodeInput(e.target.value)}
//             onCompositionStart={() => setIsComposing(true)}
//             onCompositionEnd={() => setIsComposing(false)}
//             onKeyPress={(e) => {
//               if (e.key === "Enter" && !isComposing) {
//                 checkIn(barcodeInput);
//                 setBarcodeInput("");
//               }
//             }}
//             placeholder="바코드 번호 (예: BC2101)"
//             style={{
//               width: "100%",
//               padding: "18px",
//               fontSize: "18px",
//               textAlign: "center",
//               border: "2px solid #3B82F6",
//               borderRadius: "8px",
//               boxSizing: "border-box",
//             }}
//             autoFocus
//           />
//           <p
//             style={{
//               textAlign: "center",
//               fontSize: "13px",
//               color: "#666",
//               marginTop: "10px",
//             }}
//           >
//             테스트: BC2101, BC3101 등
//           </p>
//         </div>

//         <div
//           style={{
//             border: "1px solid #ddd",
//             borderRadius: "8px",
//             padding: "15px",
//           }}
//         >
//           <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
//             최근 입실 기록
//           </h3>
//           {reservations
//             .filter((r) => r.status === "입실완료" && r.date === currentDate)
//             .slice(-5)
//             .reverse()
//             .map((r) => {
//               const student = students.find((s) => s.id === r.student_id);
//               const seat = seats.find((s) => s.id === r.seat_id);
//               return (
//                 <div
//                   key={r.id}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     padding: "10px 0",
//                     borderBottom: "1px solid #eee",
//                     fontSize: "14px",
//                   }}
//                 >
//                   <span style={{ fontWeight: "bold" }}>{student?.name}</span>
//                   <span style={{ fontSize: "13px", color: "#666" }}>
//                     {seat?.type} {seat?.number}번 | {r.check_in_time}
//                   </span>
//                 </div>
//               );
//             })}
//         </div>
//       </div>
//     );
//   };

//   const isMobile = window.innerWidth < 768;

//   return (
//     <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
//       {showLogin && <LoginView />}

//       {/* 네비게이션 */}
//       <nav
//         style={{
//           background: "white",
//           boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//           padding: "0 15px",
//         }}
//       >
//         <div
//           style={{
//             maxWidth: "1200px",
//             margin: "0 auto",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             height: "56px",
//             gap: "10px",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: isMobile ? "10px" : "30px",
//             }}
//           >
//             <h1
//               style={{
//                 fontSize: isMobile ? "16px" : "18px",
//                 fontWeight: "bold",
//                 color: "#3B82F6",
//                 margin: 0,
//                 whiteSpace: "nowrap",
//               }}
//             >
//               자율학습실
//             </h1>
//             <div
//               style={{
//                 display: "flex",
//                 gap: "6px",
//                 overflowX: "auto",
//                 flexWrap: isMobile ? "nowrap" : "wrap",
//               }}
//             >
//               <button
//                 onClick={() => setView("dashboard")}
//                 style={{
//                   padding: "8px 12px",
//                   borderRadius: "6px",
//                   border: "none",
//                   background: view === "dashboard" ? "#3B82F6" : "transparent",
//                   color: view === "dashboard" ? "white" : "black",
//                   cursor: "pointer",
//                   fontSize: "13px",
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 대시보드
//               </button>
//               {!loggedInStudent && (
//                 <button
//                   onClick={() => setView("kiosk")}
//                   style={{
//                     padding: "8px 12px",
//                     borderRadius: "6px",
//                     border: "none",
//                     background: view === "kiosk" ? "#3B82F6" : "transparent",
//                     color: view === "kiosk" ? "white" : "black",
//                     cursor: "pointer",
//                     fontSize: "13px",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   키오스크
//                 </button>
//               )}
//               {loggedInStudent && (
//                 <button
//                   onClick={() => setView("student")}
//                   style={{
//                     padding: "8px 12px",
//                     borderRadius: "6px",
//                     border: "none",
//                     background: view === "student" ? "#3B82F6" : "transparent",
//                     color: view === "student" ? "white" : "black",
//                     cursor: "pointer",
//                     fontSize: "13px",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   예약
//                 </button>
//               )}
//               {loggedInUser && loggedInUser.role === "teacher" && (
//                 <button
//                   onClick={() => setView("teacher")}
//                   style={{
//                     padding: "8px 12px",
//                     borderRadius: "6px",
//                     border: "none",
//                     background: view === "teacher" ? "#3B82F6" : "transparent",
//                     color: view === "teacher" ? "white" : "black",
//                     cursor: "pointer",
//                     fontSize: "13px",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   교사
//                 </button>
//               )}
//               {loggedInUser && loggedInUser.role === "admin" && (
//                 <button
//                   onClick={() => setView("admin")}
//                   style={{
//                     padding: "8px 12px",
//                     borderRadius: "6px",
//                     border: "none",
//                     background: view === "admin" ? "#3B82F6" : "transparent",
//                     color: view === "admin" ? "white" : "black",
//                     cursor: "pointer",
//                     fontSize: "13px",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   관리자
//                 </button>
//               )}
//               {(loggedInUser || loggedInStudent) && (
//                 <button
//                   onClick={() => setView("query")}
//                   style={{
//                     padding: "8px 12px",
//                     borderRadius: "6px",
//                     border: "none",
//                     background: view === "query" ? "#3B82F6" : "transparent",
//                     color: view === "query" ? "white" : "black",
//                     cursor: "pointer",
//                     display: loggedInStudent ? "none" : "block",
//                     fontSize: "13px",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   조회
//                 </button>
//               )}
//             </div>
//           </div>

//           <div>
//             {loggedInStudent || loggedInUser ? (
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "10px" }}
//               >
//                 <span
//                   style={{
//                     fontWeight: "bold",
//                     fontSize: "13px",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   {loggedInStudent ? loggedInStudent.name : loggedInUser?.name}
//                 </span>
//                 <button
//                   onClick={handleLogout}
//                   style={{
//                     padding: "6px 12px",
//                     background: "#EF4444",
//                     color: "white",
//                     border: "none",
//                     borderRadius: "6px",
//                     cursor: "pointer",
//                     fontSize: "12px",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   로그아웃
//                 </button>
//               </div>
//             ) : (
//               <button
//                 onClick={() => setShowLogin(true)}
//                 style={{
//                   padding: "8px 16px",
//                   background: "#3B82F6",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "6px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                   fontSize: "13px",
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 로그인
//               </button>
//             )}
//           </div>
//         </div>
//       </nav>

//       {/* 컨텐츠 */}
//       <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
//         {view === "dashboard" && <DashboardView />}
//         {view === "kiosk" && <KioskView />}
//         {view === "student" && <StudentReservationView />}
//         {view === "teacher" && <TeacherView />}
//         {view === "admin" && <AdminView />}
//         {view === "query" && <QueryView />}
//       </div>

//       {/* 날짜 표시 */}
//       <div
//         style={{
//           position: "fixed",
//           bottom: "15px",
//           right: "15px",
//           background: "white",
//           padding: "8px 16px",
//           borderRadius: "8px",
//           boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//           fontSize: "13px",
//         }}
//       >
//         <span style={{ fontWeight: "bold" }}>{currentDate}</span>
//       </div>
//     </div>
//   );
// };

// export default App;
