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
                  개판 마음의 편지!  오늘은 {moment().format('MMMM Do')} 입니다.
                </h1>
            </div>
            <div className="p-4 flex justify-center my-10">
                <button className="relative w-fit h-fit px-4 py-2 text-xl border bg-black text-white font-extrabold"><Link to="/add-guest">마음의 편지 작성하기</Link></button>
            </div>
            <div className="px-3 py-4 flex justify-center">
                <table className="w-10/12 text-md bg-gray-200 shadow-2xl mb-4">
                    <thead className="border-b">
                        <tr>
                            <th className="text-left p-3 px-5">번호</th>
                            <th className="text-left p-3 px-5">제목</th>
                            <th className="text-left p-3 px-5">내용</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            guests.map(
                                guest =>
                                    <tr key={guest.id} className="border-b hover:bg-orange-100 bg-white">
                                        <td className="p-3 px-5">{guest.id}</td>
                                        <td className="p-3 px-5">{guest.name}</td>
                                        <td className="p-3 px-5">{guest.phoneNum}</td>
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
