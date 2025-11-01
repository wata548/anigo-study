// import React, { useState, useEffect } from "react";
// import { supabase } from "./supabaseClient";
// import Papa from "papaparse";
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
//   const [currentDate, setCurrentDate] = useState("");
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

//   // 날짜 초기화
//   useEffect(() => {
//     const today = new Date().toISOString().split("T")[0];
//     setCurrentDate(today);
//   }, []);

//   // 데이터 로드
//   useEffect(() => {
//     if (currentDate) loadData();
//   }, [currentDate]);

//   const loadData = async () => {
//     try {
//       setLoading(true);
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
//       alert("데이터를 불러오는데 실패했습니다.");
//       setLoading(false);
//     }
//   };

//   // 좌석 선택 완료 (키오스크)
//   const completeSeatSelection = async (seatId: string) => {
//     if (!studentForSeatSelection) return;

//     const existing = reservations.find(
//       (r) =>
//         r.student_id === studentForSeatSelection.id && r.date === currentDate
//     );
//     if (existing) {
//       alert("이미 예약 또는 입실 완료된 학생입니다.");
//       setSelectingSeat(false);
//       setStudentForSeatSelection(null);
//       return;
//     }

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
//         .select()
//         .single();

//       if (error) {
//         if (error.code === "23505") {
//           alert("이미 입실 처리된 학생입니다.");
//         } else {
//           throw error;
//         }
//         return;
//       }

//       setReservations([...reservations, data]);
//       const seat = seats.find((s) => s.id === seatId);
//       alert(
//         `${studentForSeatSelection.name} 입실 완료! (${seat?.type} ${seat?.number}번)`
//       );
//       await loadData();
//       setSelectingSeat(false);
//       setStudentForSeatSelection(null);
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
//         alert(`${data.name}님 환영합니다!`);
//       }

//       setLoginForm({
//         grade: 2,
//         class: 1,
//         number: 1,
//         password: "",
//         email: "",
//         barcode: "",
//       });
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
//       alert(`${data.name}님 환영합니다!`);
//       setLoginForm((prev) => ({ ...prev, barcode: "" }));
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

//   // 관리자 명단 관리
//   const AdminView = () => {
//     if (!loggedInUser || loggedInUser.role !== "admin") {
//       return (
//         <div style={{ padding: "20px", textAlign: "center" }}>
//           관리자 로그인이 필요합니다.
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

//       Papa.parse(file, {
//         complete: async (result) => {
//           try {
//             const rows = result.data as string[][];
//             const newStudents = rows
//               .slice(1)
//               .map((row) => {
//                 const [grade, classNum, number, name, barcode, password] =
//                   row.map((s) => s?.trim());
//                 if (!name || !barcode) return null;
//                 const id = `${grade}${classNum}${String(number).padStart(
//                   2,
//                   "0"
//                 )}`;
//                 return {
//                   id,
//                   grade: parseInt(grade),
//                   class: parseInt(classNum),
//                   number: parseInt(number),
//                   name,
//                   barcode,
//                   password: password || "0000",
//                 };
//               })
//               .filter(Boolean);

//             if (newStudents.length === 0) {
//               alert("유효한 데이터가 없습니다.");
//               return;
//             }

//             await supabase.from("students").delete().neq("id", "");
//             const { error } = await supabase
//               .from("students")
//               .insert(newStudents);
//             if (error) throw error;

//             alert(`${newStudents.length}명의 학생 데이터가 업로드되었습니다.`);
//             await loadData();
//           } catch (error) {
//             console.error("업로드 오류:", error);
//             alert("업로드에 실패했습니다. CSV 형식을 확인해주세요.");
//           }
//         },
//         header: false,
//       });
//     };

//     return (
//       <div style={{ padding: "15px", maxWidth: "1200px", margin: "0 auto" }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             marginBottom: "20px",
//             flexWrap: "wrap",
//             gap: "10px",
//           }}
//         >
//           <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
//             학생 명단 관리
//           </h1>
//           <div style={{ display: "flex", gap: "8px" }}>
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
//               }}
//             >
//               업로드
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
//               }}
//             >
//               다운로드
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
//           <p style={{ fontSize: "13px", margin: 0 }}>
//             CSV 형식: 학년,반,번호,이름,바코드,비밀번호
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
//           교사 로그인이 필요합니다.
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
//       return { ...s, reservation, absence };
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

//         const { error } = await supabase
//           .from("absences")
//           .upsert(newAbsences, { onConflict: "student_id,date" });
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
//         // 1. 예약 있으나 입실 안 한 사람 → 미입실
//         const toUpdate = reservations
//           .filter((r) => r.date === currentDate && r.status === "예약")
//           .map((r) => ({ ...r, status: "미입실" }));

//         if (toUpdate.length > 0) {
//           await supabase
//             .from("reservations")
//             .upsert(toUpdate, { onConflict: "id" });
//         }

//         // 2. 예약도 없고 사유도 없는 사람 → 미입실 예약 생성
//         const toInsert = classStudents
//           .filter((s) => {
//             const hasRes = reservations.some(
//               (r) => r.student_id === s.id && r.date === currentDate
//             );
//             const hasAbs = absences.some(
//               (a) => a.student_id === s.id && a.date === currentDate
//             );
//             return !hasRes && !hasAbs;
//           })
//           .map((s) => ({
//             student_id: s.id,
//             seat_id: null,
//             date: currentDate,
//             status: "미입실",
//             check_in_time: null,
//           }));

//         if (toInsert.length > 0) {
//           await supabase
//             .from("reservations")
//             .upsert(toInsert, { onConflict: "student_id,date" });
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
//             gap: "10px",
//             marginBottom: "20px",
//             flexWrap: "wrap",
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
//             {[1, 2, 3, 4].map((c) => (
//               <option key={c} value={c}>
//                 {c}반
//               </option>
//             ))}
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
//                   : s.reservation?.status === "미입실"
//                   ? "#FEE2E2"
//                   : !s.reservation && !s.absence
//                   ? "#FED7AA"
//                   : s.absence
//                   ? "#DBEAFE"
//                   : "#FEF3C7";

//               const currentReason =
//                 absenceData[s.id]?.reason || s.absence?.reason || "";
//               const currentNote =
//                 absenceData[s.id]?.note || s.absence?.note || "";
//               const canEdit =
//                 !s.reservation || s.reservation.status !== "입실완료";

//               return (
//                 <div
//                   key={s.id}
//                   style={{
//                     display: "flex",
//                     flexDirection: isMobile ? "column" : "row",
//                     alignItems: "center",
//                     gap: "12px",
//                     padding: "12px",
//                     background: bgColor,
//                     borderRadius: "8px",
//                     marginBottom: "8px",
//                     opacity: canEdit ? 1 : 0.6,
//                   }}
//                 >
//                   <div style={{ minWidth: "120px", fontWeight: "bold" }}>
//                     {s.number}번 {s.name}
//                   </div>
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "repeat(4, 1fr)",
//                       gap: "6px",
//                       flex: "1",
//                     }}
//                   >
//                     {["기숙사", "교내", "교외", "기타"].map((reason) => (
//                       <button
//                         key={reason}
//                         onClick={() => {
//                           if (!canEdit) return;
//                           if (currentReason === reason) {
//                             const newData = { ...absenceData };
//                             delete newData[s.id];
//                             setAbsenceData(newData);
//                           } else {
//                             setAbsenceData({
//                               ...absenceData,
//                               [s.id]: { reason, note: currentNote },
//                             });
//                           }
//                         }}
//                         disabled={!canEdit}
//                         style={{
//                           padding: "8px",
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
//                               : canEdit
//                               ? "black"
//                               : "#ccc",
//                           cursor: canEdit ? "pointer" : "not-allowed",
//                           borderRadius: "6px",
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
//                       if (!canEdit) return;
//                       setAbsenceData({
//                         ...absenceData,
//                         [s.id]: { reason: currentReason, note: e.target.value },
//                       });
//                     }}
//                     disabled={!canEdit}
//                     placeholder="상세 사유"
//                     style={{
//                       flex: "0 0 150px",
//                       padding: "8px",
//                       border: "1px solid #ddd",
//                       borderRadius: "6px",
//                       fontSize: "13px",
//                     }}
//                   />
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//         <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
//           <button
//             onClick={handleSaveAll}
//             style={{
//               flex: "1",
//               padding: "15px",
//               background: "#3B82F6",
//               color: "white",
//               border: "none",
//               borderRadius: "10px",
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
//               fontWeight: "bold",
//               cursor: "pointer",
//             }}
//           >
//             미입실 체크
//           </button>
//         </div>
//       </div>
//     );
//   };

//   // 조회 화면
//   const QueryView = () => {
//     const [queryGrade, setQueryGrade] = useState(2);
//     const [queryClass, setQueryClass] = useState(1);

//     const classStudents = students.filter(
//       (s) => s.grade === queryGrade && s.class === queryClass
//     );
//     const studentsWithStatus = classStudents.map((s) => {
//       const reservation = reservations.find(
//         (r) => r.student_id === s.id && r.date === currentDate
//       );
//       const absence = absences.find(
//         (a) => a.student_id === s.id && a.date === currentDate
//       );
//       return { ...s, reservation, absence };
//     });

//     const stats = {
//       total: classStudents.length,
//       present: studentsWithStatus.filter(
//         (s) => s.reservation?.status === "입실완료"
//       ).length,
//       absent: studentsWithStatus.filter((s) => s.absence).length,
//       noShow: studentsWithStatus.filter(
//         (s) => s.reservation?.status === "미입실"
//       ).length,
//     };

//     return (
//       <div style={{ padding: "15px", maxWidth: "1200px", margin: "0 auto" }}>
//         <h1
//           style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}
//         >
//           출석 조회
//         </h1>
//         <div
//           style={{
//             display: "flex",
//             gap: "10px",
//             marginBottom: "20px",
//             flexWrap: "wrap",
//           }}
//         >
//           <select
//             value={queryGrade}
//             onChange={(e) => setQueryGrade(Number(e.target.value))}
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
//             value={queryClass}
//             onChange={(e) => setQueryClass(Number(e.target.value))}
//             style={{
//               padding: "12px",
//               border: "2px solid #ddd",
//               borderRadius: "8px",
//               fontSize: "14px",
//               flex: "1",
//             }}
//           >
//             {[1, 2, 3, 4].map((c) => (
//               <option key={c} value={c}>
//                 {c}반
//               </option>
//             ))}
//           </select>
//         </div>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
//             gap: "12px",
//             marginBottom: "20px",
//           }}
//         >
//           <div
//             style={{
//               background: "white",
//               padding: "15px",
//               borderRadius: "12px",
//               border: "2px solid #ddd",
//             }}
//           >
//             <div
//               style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}
//             >
//               전체
//             </div>
//             <div style={{ fontSize: "24px", fontWeight: "bold" }}>
//               {stats.total}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#D1FAE5",
//               padding: "15px",
//               borderRadius: "12px",
//               border: "2px solid #10B981",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "13px",
//                 color: "#065F46",
//                 marginBottom: "5px",
//               }}
//             >
//               입실
//             </div>
//             <div
//               style={{ fontSize: "24px", fontWeight: "bold", color: "#065F46" }}
//             >
//               {stats.present}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#DBEAFE",
//               padding: "15px",
//               borderRadius: "12px",
//               border: "2px solid #3B82F6",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "13px",
//                 color: "#1E40AF",
//                 marginBottom: "5px",
//               }}
//             >
//               사유
//             </div>
//             <div
//               style={{ fontSize: "24px", fontWeight: "bold", color: "#1E40AF" }}
//             >
//               {stats.absent}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#FEE2E2",
//               padding: "15px",
//               borderRadius: "12px",
//               border: "2px solid #EF4444",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "13px",
//                 color: "#991B1B",
//                 marginBottom: "5px",
//               }}
//             >
//               미입실
//             </div>
//             <div
//               style={{ fontSize: "24px", fontWeight: "bold", color: "#991B1B" }}
//             >
//               {stats.noShow}명
//             </div>
//           </div>
//         </div>

//         <div
//           style={{
//             background: "white",
//             borderRadius: "12px",
//             padding: "15px",
//             border: "2px solid #ddd",
//           }}
//         >
//           <h3
//             style={{
//               fontSize: "16px",
//               fontWeight: "bold",
//               marginBottom: "15px",
//             }}
//           >
//             {queryGrade}학년 {queryClass}반 상세
//           </h3>
//           <div style={{ display: "grid", gap: "8px" }}>
//             {studentsWithStatus.map((s) => {
//               const bgColor =
//                 s.reservation?.status === "입실완료"
//                   ? "#D1FAE5"
//                   : s.reservation?.status === "미입실"
//                   ? "#FEE2E2"
//                   : s.absence
//                   ? "#DBEAFE"
//                   : "#FEF3C7";

//               const statusText =
//                 s.reservation?.status === "입실완료"
//                   ? `입실완료 (${s.reservation.check_in_time || "-"})`
//                   : s.reservation?.status === "미입실"
//                   ? "미입실"
//                   : s.absence
//                   ? `${s.absence.reason}${
//                       s.absence.note ? `: ${s.absence.note}` : ""
//                     }`
//                   : "미처리";

//               return (
//                 <div
//                   key={s.id}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     padding: "12px",
//                     background: bgColor,
//                     borderRadius: "8px",
//                   }}
//                 >
//                   <span style={{ fontWeight: "bold" }}>
//                     {s.number}번 {s.name}
//                   </span>
//                   <span style={{ fontSize: "14px" }}>{statusText}</span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // 학생 예약 화면
//   const StudentReservationView = () => {
//     if (!loggedInStudent) {
//       return (
//         <div style={{ padding: "20px", textAlign: "center" }}>
//           학생 로그인이 필요합니다.
//         </div>
//       );
//     }

//     const myReservation = reservations.find(
//       (r) => r.student_id === loggedInStudent.id && r.date === currentDate
//     );
//     const availableSeats = seats.filter((seat) => {
//       if (seat.grade !== loggedInStudent.grade) return false;
//       return !reservations.some(
//         (r) => r.seat_id === seat.id && r.date === currentDate
//       );
//     });

//     const handleReserve = async (seatId: string) => {
//       if (myReservation) {
//         alert("이미 예약하셨습니다.");
//         return;
//       }

//       try {
//         const { data, error } = await supabase
//           .from("reservations")
//           .insert([
//             {
//               student_id: loggedInStudent.id,
//               seat_id: seatId,
//               date: currentDate,
//               status: "예약",
//             },
//           ])
//           .select()
//           .single();

//         if (error) throw error;

//         setReservations([...reservations, data]);
//         const seat = seats.find((s) => s.id === seatId);
//         alert(`좌석 예약이 완료되었습니다! (${seat?.type} ${seat?.number}번)`);
//         await loadData();
//       } catch (error) {
//         console.error("예약 오류:", error);
//         alert("예약에 실패했습니다.");
//       }
//     };

//     const handleCancelReservation = async () => {
//       if (!myReservation || myReservation.status !== "예약") {
//         alert("취소할 수 있는 예약이 없습니다.");
//         return;
//       }

//       try {
//         const { error } = await supabase
//           .from("reservations")
//           .delete()
//           .eq("id", myReservation.id);
//         if (error) throw error;

//         setReservations(reservations.filter((r) => r.id !== myReservation.id));
//         alert("예약이 취소되었습니다.");
//         await loadData();
//       } catch (error) {
//         console.error("취소 오류:", error);
//         alert("예약 취소에 실패했습니다.");
//       }
//     };

//     return (
//       <div style={{ padding: "15px", maxWidth: "1200px", margin: "0 auto" }}>
//         <h1
//           style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}
//         >
//           {loggedInStudent.name}님의 좌석 예약
//         </h1>

//         {myReservation && (
//           <div
//             style={{
//               background:
//                 myReservation.status === "입실완료" ? "#D1FAE5" : "#FEF3C7",
//               padding: "20px",
//               borderRadius: "12px",
//               marginBottom: "20px",
//               border:
//                 "2px solid " +
//                 (myReservation.status === "입실완료" ? "#10B981" : "#F59E0B"),
//             }}
//           >
//             <h3
//               style={{
//                 fontSize: "16px",
//                 fontWeight: "bold",
//                 marginBottom: "10px",
//               }}
//             >
//               현재 예약 정보
//             </h3>
//             <p>
//               좌석: {seats.find((s) => s.id === myReservation.seat_id)?.type}{" "}
//               {seats.find((s) => s.id === myReservation.seat_id)?.number}번
//             </p>
//             <p>상태: {myReservation.status}</p>
//             {myReservation.check_in_time && (
//               <p>입실 시간: {myReservation.check_in_time}</p>
//             )}
//             {myReservation.status === "예약" && (
//               <button
//                 onClick={handleCancelReservation}
//                 style={{
//                   marginTop: "10px",
//                   padding: "10px 20px",
//                   background: "#EF4444",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "8px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                 }}
//               >
//                 예약 취소
//               </button>
//             )}
//           </div>
//         )}

//         {!myReservation && (
//           <>
//             <div
//               style={{
//                 background: "#FEF3C7",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 marginBottom: "15px",
//               }}
//             >
//               <p style={{ fontSize: "13px", margin: 0 }}>
//                 사용 가능한 좌석: {availableSeats.length}개 /{" "}
//                 {seats.filter((s) => s.grade === loggedInStudent.grade).length}
//                 개
//               </p>
//             </div>

//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
//                 gap: "8px",
//               }}
//             >
//               {seats
//                 .filter((s) => s.grade === loggedInStudent.grade)
//                 .map((seat) => {
//                   const isReserved = reservations.some(
//                     (r) => r.seat_id === seat.id && r.date === currentDate
//                   );
//                   return (
//                     <button
//                       key={seat.id}
//                       onClick={() => !isReserved && handleReserve(seat.id)}
//                       disabled={isReserved}
//                       style={{
//                         padding: "15px",
//                         background: isReserved ? "#E5E7EB" : "#10B981",
//                         color: isReserved ? "#9CA3AF" : "white",
//                         border: "none",
//                         borderRadius: "8px",
//                         fontWeight: "bold",
//                         cursor: isReserved ? "not-allowed" : "pointer",
//                         fontSize: "14px",
//                       }}
//                     >
//                       {seat.group}-{seat.number}
//                     </button>
//                   );
//                 })}
//             </div>
//           </>
//         )}
//       </div>
//     );
//   };

//   // 키오스크 화면
//   const KioskView = () => {
//     const handleBarcodeSubmit = async () => {
//       if (!barcodeInput.trim()) {
//         alert("바코드를 입력해주세요.");
//         return;
//       }

//       try {
//         const { data, error } = await supabase
//           .from("students")
//           .select("*")
//           .eq("barcode", barcodeInput.trim())
//           .single();

//         if (error || !data) {
//           alert("등록되지 않은 바코드입니다.");
//           setBarcodeInput("");
//           return;
//         }

//         const existing = reservations.find(
//           (r) => r.student_id === data.id && r.date === currentDate
//         );
//         if (existing) {
//           if (existing.status === "입실완료") {
//             alert("이미 입실 완료된 학생입니다.");
//           } else {
//             alert("이미 예약된 학생입니다. 좌석을 선택해주세요.");
//             setStudentForSeatSelection(data);
//             setSelectingSeat(true);
//           }
//           setBarcodeInput("");
//           return;
//         }

//         setStudentForSeatSelection(data);
//         setSelectingSeat(true);
//         setBarcodeInput("");
//       } catch (error) {
//         console.error("바코드 인식 오류:", error);
//         alert("바코드 인식에 실패했습니다.");
//         setBarcodeInput("");
//       }
//     };

//     if (selectingSeat && studentForSeatSelection) {
//       const availableSeats = seats.filter((seat) => {
//         if (seat.grade !== studentForSeatSelection.grade) return false;
//         return !reservations.some(
//           (r) => r.seat_id === seat.id && r.date === currentDate
//         );
//       });

//       return (
//         <div style={{ padding: "15px", maxWidth: "1200px", margin: "0 auto" }}>
//           <h1
//             style={{
//               fontSize: "24px",
//               fontWeight: "bold",
//               marginBottom: "20px",
//               textAlign: "center",
//             }}
//           >
//             {studentForSeatSelection.name}님, 좌석을 선택해주세요
//           </h1>
//           <div
//             style={{
//               background: "#FEF3C7",
//               padding: "15px",
//               borderRadius: "12px",
//               marginBottom: "20px",
//               textAlign: "center",
//             }}
//           >
//             <p style={{ fontSize: "16px", margin: 0 }}>
//               사용 가능: {availableSeats.length}개 /{" "}
//               {
//                 seats.filter((s) => s.grade === studentForSeatSelection.grade)
//                   .length
//               }
//               개
//             </p>
//           </div>
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
//               gap: "10px",
//               marginBottom: "20px",
//             }}
//           >
//             {seats
//               .filter((s) => s.grade === studentForSeatSelection.grade)
//               .map((seat) => {
//                 const isReserved = reservations.some(
//                   (r) => r.seat_id === seat.id && r.date === currentDate
//                 );
//                 return (
//                   <button
//                     key={seat.id}
//                     onClick={() =>
//                       !isReserved && completeSeatSelection(seat.id)
//                     }
//                     disabled={isReserved}
//                     style={{
//                       padding: "20px",
//                       background: isReserved ? "#E5E7EB" : "#10B981",
//                       color: isReserved ? "#9CA3AF" : "white",
//                       border: "none",
//                       borderRadius: "12px",
//                       fontWeight: "bold",
//                       cursor: isReserved ? "not-allowed" : "pointer",
//                       fontSize: "16px",
//                     }}
//                   >
//                     {seat.group}-{seat.number}
//                   </button>
//                 );
//               })}
//           </div>
//           <button
//             onClick={() => {
//               setSelectingSeat(false);
//               setStudentForSeatSelection(null);
//             }}
//             style={{
//               width: "100%",
//               padding: "15px",
//               background: "#EF4444",
//               color: "white",
//               border: "none",
//               borderRadius: "12px",
//               fontWeight: "bold",
//               fontSize: "16px",
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
//             fontSize: "28px",
//             fontWeight: "bold",
//             marginBottom: "30px",
//             textAlign: "center",
//           }}
//         >
//           독서실 입실 키오스크
//         </h1>
//         <div
//           style={{
//             background: "white",
//             padding: "30px",
//             borderRadius: "16px",
//             border: "2px solid #ddd",
//           }}
//         >
//           <label
//             style={{
//               display: "block",
//               marginBottom: "15px",
//               fontSize: "18px",
//               fontWeight: "bold",
//             }}
//           >
//             학생증 바코드 스캔
//           </label>
//           <input
//             type="text"
//             value={barcodeInput}
//             onChange={(e) => setBarcodeInput(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && handleBarcodeSubmit()}
//             placeholder="바코드 번호 입력..."
//             style={{
//               width: "100%",
//               padding: "15px",
//               border: "2px solid #ddd",
//               borderRadius: "12px",
//               fontSize: "16px",
//               marginBottom: "15px",
//               boxSizing: "border-box",
//             }}
//             autoFocus
//           />
//           <button
//             onClick={handleBarcodeSubmit}
//             style={{
//               width: "100%",
//               padding: "18px",
//               background: "#3B82F6",
//               color: "white",
//               border: "none",
//               borderRadius: "12px",
//               fontWeight: "bold",
//               fontSize: "18px",
//               cursor: "pointer",
//             }}
//           >
//             입실하기
//           </button>
//         </div>
//       </div>
//     );
//   };

//   // 대시보드
//   const DashboardView = () => {
//     const stats = {
//       total: students.length,
//       present: reservations.filter(
//         (r) => r.date === currentDate && r.status === "입실완료"
//       ).length,
//       absent: absences.filter((a) => a.date === currentDate).length,
//       noShow: reservations.filter(
//         (r) => r.date === currentDate && r.status === "미입실"
//       ).length,
//     };

//     return (
//       <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
//         <h1
//           style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
//         >
//           독서실 관리 시스템
//         </h1>
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
//             gap: "15px",
//             marginBottom: "30px",
//           }}
//         >
//           <div
//             style={{
//               background: "white",
//               padding: "20px",
//               borderRadius: "12px",
//               border: "2px solid #ddd",
//             }}
//           >
//             <div
//               style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}
//             >
//               전체 학생
//             </div>
//             <div style={{ fontSize: "32px", fontWeight: "bold" }}>
//               {stats.total}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#D1FAE5",
//               padding: "20px",
//               borderRadius: "12px",
//               border: "2px solid #10B981",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "14px",
//                 color: "#065F46",
//                 marginBottom: "8px",
//               }}
//             >
//               입실
//             </div>
//             <div
//               style={{ fontSize: "32px", fontWeight: "bold", color: "#065F46" }}
//             >
//               {stats.present}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#DBEAFE",
//               padding: "20px",
//               borderRadius: "12px",
//               border: "2px solid #3B82F6",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "14px",
//                 color: "#1E40AF",
//                 marginBottom: "8px",
//               }}
//             >
//               사유
//             </div>
//             <div
//               style={{ fontSize: "32px", fontWeight: "bold", color: "#1E40AF" }}
//             >
//               {stats.absent}명
//             </div>
//           </div>
//           <div
//             style={{
//               background: "#FEE2E2",
//               padding: "20px",
//               borderRadius: "12px",
//               border: "2px solid #EF4444",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "14px",
//                 color: "#991B1B",
//                 marginBottom: "8px",
//               }}
//             >
//               미입실
//             </div>
//             <div
//               style={{ fontSize: "32px", fontWeight: "bold", color: "#991B1B" }}
//             >
//               {stats.noShow}명
//             </div>
//           </div>
//         </div>

//         <div
//           style={{
//             background: "white",
//             padding: "20px",
//             borderRadius: "12px",
//             border: "2px solid #ddd",
//           }}
//         >
//           <h2
//             style={{
//               fontSize: "18px",
//               fontWeight: "bold",
//               marginBottom: "15px",
//             }}
//           >
//             메뉴
//           </h2>
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
//               gap: "12px",
//             }}
//           >
//             <button
//               onClick={() => setShowLogin(true)}
//               style={{
//                 padding: "15px",
//                 background: "#3B82F6",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "10px",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//                 fontSize: "16px",
//               }}
//             >
//               로그인
//             </button>
//             <button
//               onClick={() => setView("query")}
//               style={{
//                 padding: "15px",
//                 background: "#10B981",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "10px",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//                 fontSize: "16px",
//               }}
//             >
//               출석 조회
//             </button>
//             <button
//               onClick={() => setView("kiosk")}
//               style={{
//                 padding: "15px",
//                 background: "#F59E0B",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "10px",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//                 fontSize: "16px",
//               }}
//             >
//               키오스크
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // 로그인 화면
//   const LoginView = () => {
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
//           alignItems: "center",
//           justifyContent: "center",
//           zIndex: 1000,
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
//             borderRadius: "16px",
//             padding: "25px 20px",
//             width: "90%",
//             maxWidth: "400px",
//             maxHeight: "90vh",
//             overflow: "auto",
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
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: "8px",
//               marginBottom: "20px",
//             }}
//           >
//             {(["student", "teacher", "admin"] as const).map((type) => (
//               <button
//                 key={type}
//                 onClick={() => setLoginType(type)}
//                 style={{
//                   padding: "12px",
//                   border:
//                     loginType === type ? "2px solid #3B82F6" : "1px solid #ddd",
//                   borderRadius: "8px",
//                   background: loginType === type ? "#EFF6FF" : "white",
//                   fontWeight: loginType === type ? "bold" : "normal",
//                   cursor: "pointer",
//                 }}
//               >
//                 {type === "student"
//                   ? "학생"
//                   : type === "teacher"
//                   ? "교사"
//                   : "관리자"}
//               </button>
//             ))}
//           </div>

//           {loginType === "student" ? (
//             <>
//               <div style={{ marginBottom: "20px" }}>
//                 <label
//                   style={{
//                     display: "block",
//                     marginBottom: "10px",
//                     fontWeight: "bold",
//                   }}
//                 >
//                   학년/반/번호
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
//                       padding: "10px",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
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
//                       padding: "10px",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                     }}
//                   >
//                     {[1, 2, 3, 4].map((c) => (
//                       <option key={c} value={c}>
//                         {c}반
//                       </option>
//                     ))}
//                   </select>
//                   <input
//                     type="number"
//                     value={loginForm.number}
//                     onChange={(e) =>
//                       setLoginForm({
//                         ...loginForm,
//                         number: Number(e.target.value),
//                       })
//                     }
//                     style={{
//                       padding: "10px",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                     }}
//                   />
//                 </div>
//                 <input
//                   type="password"
//                   placeholder="비밀번호"
//                   value={loginForm.password}
//                   onChange={(e) =>
//                     setLoginForm({ ...loginForm, password: e.target.value })
//                   }
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       handleLogin();
//                     }
//                   }}
//                   style={{
//                     width: "100%",
//                     padding: "12px",
//                     border: "1px solid #ddd",
//                     borderRadius: "8px",
//                     boxSizing: "border-box",
//                   }}
//                 />
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
//                   cursor: "pointer",
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
//                   }}
//                 >
//                   바코드 로그인
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="학생증 스캔"
//                   value={loginForm.barcode}
//                   onChange={(e) =>
//                     setLoginForm({ ...loginForm, barcode: e.target.value })
//                   }
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
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
//                     cursor: "pointer",
//                   }}
//                 >
//                   바코드 로그인
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <input
//                 type="email"
//                 placeholder={
//                   loginType === "admin"
//                     ? "admin@school.com"
//                     : "teacher@school.com"
//                 }
//                 value={loginForm.email}
//                 onChange={(e) =>
//                   setLoginForm({ ...loginForm, email: e.target.value })
//                 }
//                 style={{
//                   width: "100%",
//                   padding: "12px",
//                   border: "1px solid #ddd",
//                   borderRadius: "8px",
//                   marginBottom: "15px",
//                   boxSizing: "border-box",
//                 }}
//               />
//               <input
//                 type="password"
//                 placeholder="비밀번호"
//                 value={loginForm.password}
//                 onChange={(e) =>
//                   setLoginForm({ ...loginForm, password: e.target.value })
//                 }
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleLogin();
//                   }
//                 }}
//                 style={{
//                   width: "100%",
//                   padding: "12px",
//                   border: "1px solid #ddd",
//                   borderRadius: "8px",
//                   marginBottom: "15px",
//                   boxSizing: "border-box",
//                 }}
//               />
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
//             }}
//           >
//             취소
//           </button>
//         </div>
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

//   return (
//     <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
//       {showLogin && <LoginView />}

//       {/* 네비게이션 */}
//       <nav
//         style={{
//           background: "white",
//           borderBottom: "2px solid #ddd",
//           padding: "15px 20px",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             maxWidth: "1400px",
//             margin: "0 auto",
//             flexWrap: "wrap",
//             gap: "10px",
//           }}
//         >
//           <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
//             <button
//               onClick={() => setView("dashboard")}
//               style={{
//                 padding: "10px 16px",
//                 background: view === "dashboard" ? "#3B82F6" : "white",
//                 color: view === "dashboard" ? "white" : "black",
//                 border: "1px solid #ddd",
//                 borderRadius: "8px",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//               }}
//             >
//               대시보드
//             </button>
//             {loggedInStudent && (
//               <button
//                 onClick={() => setView("student")}
//                 style={{
//                   padding: "10px 16px",
//                   background: view === "student" ? "#3B82F6" : "white",
//                   color: view === "student" ? "white" : "black",
//                   border: "1px solid #ddd",
//                   borderRadius: "8px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                 }}
//               >
//                 내 예약
//               </button>
//             )}
//             {loggedInUser?.role === "teacher" && (
//               <button
//                 onClick={() => setView("teacher")}
//                 style={{
//                   padding: "10px 16px",
//                   background: view === "teacher" ? "#3B82F6" : "white",
//                   color: view === "teacher" ? "white" : "black",
//                   border: "1px solid #ddd",
//                   borderRadius: "8px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                 }}
//               >
//                 교사 관리
//               </button>
//             )}
//             {loggedInUser?.role === "admin" && (
//               <button
//                 onClick={() => setView("admin")}
//                 style={{
//                   padding: "10px 16px",
//                   background: view === "admin" ? "#3B82F6" : "white",
//                   color: view === "admin" ? "white" : "black",
//                   border: "1px solid #ddd",
//                   borderRadius: "8px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                 }}
//               >
//                 명단 관리
//               </button>
//             )}
//             <button
//               onClick={() => setView("query")}
//               style={{
//                 padding: "10px 16px",
//                 background: view === "query" ? "#3B82F6" : "white",
//                 color: view === "query" ? "white" : "black",
//                 border: "1px solid #ddd",
//                 borderRadius: "8px",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//               }}
//             >
//               출석 조회
//             </button>
//             <button
//               onClick={() => setView("kiosk")}
//               style={{
//                 padding: "10px 16px",
//                 background: view === "kiosk" ? "#3B82F6" : "white",
//                 color: view === "kiosk" ? "white" : "black",
//                 border: "1px solid #ddd",
//                 borderRadius: "8px",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//               }}
//             >
//               키오스크
//             </button>
//           </div>
//           <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//             <input
//               type="date"
//               value={currentDate}
//               onChange={(e) => setCurrentDate(e.target.value)}
//               style={{
//                 padding: "10px",
//                 border: "1px solid #ddd",
//                 borderRadius: "8px",
//               }}
//             />
//             {(loggedInStudent || loggedInUser) && (
//               <button
//                 onClick={handleLogout}
//                 style={{
//                   padding: "10px 16px",
//                   background: "#EF4444",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "8px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                 }}
//               >
//                 로그아웃
//               </button>
//             )}
//           </div>
//         </div>
//       </nav>

//       {/* 메인 콘텐츠 */}
//       <main>
//         {view === "dashboard" && <DashboardView />}
//         {view === "admin" && <AdminView />}
//         {view === "teacher" && <TeacherView />}
//         {view === "query" && <QueryView />}
//         {view === "student" && <StudentReservationView />}
//         {view === "kiosk" && <KioskView />}
//       </main>
//     </div>
//   );
// };

// export default App;
