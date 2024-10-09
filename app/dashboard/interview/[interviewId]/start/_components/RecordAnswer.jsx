"use client";
import Webcam from 'react-webcam';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '../../../../../../components/ui/button';
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import { chatSession } from '../../../../../../utils/GeminiAIModel';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';

function RecordAnswer(mockInterviewQuestion,activeQuestionIndex,interviewData) {
    const [userAnswer, setUserAnswer] = useState('');
    const {user}=useUser();
    const[loading,setLoading]=useState(false);
    const {
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false
    });

    useEffect(() => {
        results.forEach((result) => {
            if (result?.transcript) {
                setUserAnswer(prevAns => prevAns + result.transcript);
            }
        });
    }, [results]);

    const SaveUserAnswer=async()=>{
        if(isRecording){
            setLoading(true);
            stopSpeechToText();
            if(userAnswer?.length<10){
                setLoading(false);
                toast('Error while saving your anser. Please record again.')
                 return ;
            }

            const feedbackPrompt="Question:"+mockInterviewQuestion[activeQuestionIndex]?.question+
            ", User Answer:"+userAnswer+",Depending on question and user answer for the given question"+
            " please give us rating for answer out of 10 and feedback as area of improvement if any"+
            "in just 3 to 5 lines to improve it in JSON format with rating field and feedback field"

            const result= await chatSession.sendMessage(feedbackPrompt);

            const mockJsonResp=(result.response.text())
            .replace('```json', '')
            .replace('```', '');
            console.log(mockJsonResp);
            const JsonFeedbackResponse=JSON.parse(mockJsonResp);

            const resp=await db.insert(userAnswer)
            .values({
                mockIdRef:interviewData.mockId,
                question:mockInterviewQuestion[activeQuestionIndex]?.question,
                correctAns:mockInterviewQuestion[activeQuestionIndex]?.answer,
                userAns:userAnswer,
                feedback:JsonFeedbackResponse?.feedback,
                rating:JsonFeedbackResponse?.rating,
                userEmail:user?.primaryEmailAddress?.emailAddress,
                createdAt:moment().format('MM-DD-YYYY') ,
            })
            if(resp){
                toast('User Answer recorded successfully')
            }
            setLoading(false);
        }else{
            startSpeechToText();
        }
    }

    return (
        <div className='flex items-center justify-center flex-col'>
            <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5'>
                <Image src={'/webcam.png'} width={200} height={200} className='absolute' />
                <Webcam
                    mirrored={true}
                    style={{
                        height: 300,
                        width: '100%',
                        zIndex: 10,
                    }}
                />
            </div>
            <Button
            disabled={loading}
            variant='outline' className='my-10'
                onClick={SaveUserAnswer}
            >
                {isRecording ? 
                    <h2 className='text-red-600 flrx gap-2'>
                        <StopCircle /> Stop Recording
                    </h2>
                 : 
                    <h2 className='text-primary flex-gap-2 items-center'>
                        <Mic/> Record Answer</h2>}</Button>
            <Button onClick={() => console.log(userAnswer)}>Show User Answer</Button>
        </div>
    );
}

export default RecordAnswer;
