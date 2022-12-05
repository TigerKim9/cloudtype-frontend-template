import React, {useEffect, useState} from "react";
import WaitlistService from "../services/WaitlistService";
import moment from "moment";
import "moment/locale/ko";
import {Link} from "react-router-dom";

const ListGuests = () => {

    const [guests, setGuests] = useState([])

    useEffect(() => {
        getAllGuests();
    }, [])

    const getAllGuests = () => {

        WaitlistService.getAllGuests()
            .then((response) => {
                setGuests(response.data);
                console.log(response.data);
            })
            .catch(error => {
                console.log(error);
            })
    }

    const deleteGuest = (guestId) => {

        WaitlistService.deleteGuest(guestId)
            .then((response) => {
                getAllGuests();
                console.log(response.data);
            })
            .catch(error => {
                console.log(error);
            })
    }

    return (
        <div className="text-gray-900">
            <div className="p-4 flex justify-center my-10">
                <h1 className="text-3xl font-extrabold text">
                    오늘은 {moment().format('MMMM Do')} 입니다.
                </h1>
            </div>
            <div className="p-4 flex justify-center my-10">
                <button className="relative w-fit h-fit px-4 py-2 text-xl border bg-black text-white font-extrabold"><Link to="/add-guest">웨이팅 리스트 작성하기</Link></button>
            </div>
            <div className="px-3 py-4 flex justify-center">
                <table className="w-10/12 text-md bg-gray-200 shadow-2xl mb-4">
                    <thead className="border-b">
                        <tr>
                            <th className="text-left p-3 px-5">번호</th>
                            <th className="text-left p-3 px-5">이름</th>
                            <th className="text-left p-3 px-5">인원 수</th>
                            <th className="text-left p-3 px-5">연락처</th>
                            <th className="text-left p-3 px-5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            guests.map(
                                guest =>
                                    <tr key={guest.id} className="border-b hover:bg-orange-100 bg-white">
                                        <td className="p-3 px-5">{guest.id}</td>
                                        <td className="p-3 px-5">{guest.name}</td>
                                        <td className="p-3 px-5">{guest.num}</td>
                                        <td className="p-3 px-5">{guest.phoneNum}</td>
                                        <td className="p-3 px-5">
                                            <button
                                                type="button"
                                                className="border border-gray-700 bg-gray-700 text-white font-bold px-4 py-2 m-2 transition duration-500 ease select-none hover:bg-gray-800 focus:outline-none focus:shadow-outline"
                                            >
                                                <Link to={`/edit-guest/${guest.id}`}>수정</Link>
                                            </button>
                                            <button
                                                type="button"
                                                className="border border-red-500 bg-red-500 text-white font-bold px-4 py-2 m-2 transition duration-500 ease select-none hover:bg-red-800 focus:outline-none focus:shadow-outline"
                                                onClick={() => deleteGuest(guest.id)}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ListGuests