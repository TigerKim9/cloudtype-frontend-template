import React, {useEffect, useState} from "react";
import WaitlistService from "../services/WaitlistService";
import {useNavigate, useParams} from "react-router-dom";

const AddGuest = () => {

    const [name, setName] = useState('');
    const [num, setNum] = useState('');
    const [phoneNum, setPhoneNum] = useState('');
    const navigate = useNavigate();
    const {id} = useParams();

    const saveOrUpdateGuest = (e) => {
        e.preventDefault();

        const guest = {name, num, phoneNum};

        if (id) {

            WaitlistService.updateGuest(id, guest)
                .then((response) => {
                    navigate('/waitlist');
                })
                .catch(error => {
                    console.log(error)
                })

        } else {

            WaitlistService.createGuest(guest)
                .then((response) => {
                    console.log(response.data);
                    navigate('/waitlist');
                })
                .catch(error => {
                    console.log(error)
                })
        }
    }

    useEffect(() => {

        WaitlistService.getGuestById(id)
            .then((response) => {
                setName(response.data.name)
                setNum(response.data.num)
                setPhoneNum(response.data.phoneNum)
                console.log(response.data)
            })
            .catch(error => {
                console.log(error)
            })
    }, [id])

    return (
        <div className="text-gray-900">
            <div className="p-4 flex justify-center my-10">
                <h1 className="text-3xl font-extrabold text">웨이팅 리스트를 작성해주세요 😀</h1>
            </div>
            <div className="px-3 py-4 flex justify-center">
                <form>
                    <div className="flex items-center mb-5">
                        <label htmlFor="name"
                               className="inline-block w-11/12 mr-6 text-right font-bold text-gray-600">이름</label>
                        <input type="text"
                               id="name"
                               name="name"
                               placeholder="이름"
                               value={name}
                               onChange={(e) => setName(e.target.value)}
                               className="flex-1 py-2 border-b-2 border-gray-400 focus:border-black
                                          text-gray-600 placeholder-gray-400
                                          outline-none">

                        </input>
                    </div>
                    <div className="flex items-center mb-5">
                        <label htmlFor="num"
                               className="inline-block w-11/12 mr-6 text-right font-bold text-gray-600">인원</label>
                        <input type="number"
                               id="num"
                               name="num"
                               placeholder="인원"
                               value={num}
                               onChange={(e) => setNum(e.target.value)}
                               className="flex-1 py-2 border-b-2 border-gray-400 focus:border-black
                                          text-gray-600 placeholder-gray-400
                                          outline-none">

                        </input>
                    </div>
                    <div className="flex items-center mb-5">
                        <label htmlFor="phoneNum"
                               className="inline-block w-11/12 mr-6 text-right font-bold text-gray-600">연락처</label>
                        <input type="text"
                               id="phoneNum"
                               name="phoneNum"
                               placeholder="예) 01012345678"
                               value={phoneNum}
                               onChange={(e) => setPhoneNum(e.target.value)}
                               className="flex-1 py-2 border-b-2 border-gray-400 focus:border-black
                                          text-gray-600 placeholder-gray-400
                                          outline-none">

                        </input>
                    </div>

                    <button
                        onClick={(e) => saveOrUpdateGuest(e)}
                        className="relative w-fit h-fit px-36 py-2 mt-20 text-xl border bg-black text-white font-extrabold">
                        등록
                    </button>

                </form>
            </div>
        </div>
    )
}

export default AddGuest;