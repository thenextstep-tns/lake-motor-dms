'use client';

import { useState, useEffect, useRef } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
}

export default function RangeSlider({ min, max, value, onChange, step = 1 }: RangeSliderProps) {
    const [minVal, setMinVal] = useState(value[0]);
    const [maxVal, setMaxVal] = useState(value[1]);
    const minValRef = useRef(value[0]);
    const maxValRef = useRef(value[1]);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = (value: number) => Math.round(((value - min) / (max - min)) * 100);

    // Sync state with props
    useEffect(() => {
        setMinVal(value[0]);
        setMaxVal(value[1]);
        minValRef.current = value[0];
        maxValRef.current = value[1];
    }, [value]);

    // Update range width and position
    useEffect(() => {
        const minPercent = getPercent(minVal);
        const maxPercent = getPercent(maxValRef.current);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minVal, min, max]);

    useEffect(() => {
        const minPercent = getPercent(minValRef.current);
        const maxPercent = getPercent(maxVal);

        if (range.current) {
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [maxVal, min, max]);

    return (
        <div className="relative w-full h-6 flex items-center justify-center">
            <input
                type="range"
                min={min}
                max={max}
                value={minVal}
                step={step}
                onChange={(event) => {
                    const value = Math.min(Number(event.target.value), maxVal - 1);
                    setMinVal(value);
                    minValRef.current = value;
                    onChange([value, maxVal]);
                }}
                className="thumb thumb--left pointer-events-none absolute h-0 w-full outline-none z-[3] appearance-none"
                style={{ zIndex: minVal > max - 100 ? 5 : 3 }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={maxVal}
                step={step}
                onChange={(event) => {
                    const value = Math.max(Number(event.target.value), minVal + 1);
                    setMaxVal(value);
                    maxValRef.current = value;
                    onChange([minVal, value]);
                }}
                className="thumb thumb--right pointer-events-none absolute h-0 w-full outline-none z-[4] appearance-none"
            />

            <div className="relative w-full">
                <div className="absolute w-full h-1.5 bg-gray-700 rounded z-[1]"></div>
                <div
                    ref={range}
                    className="absolute h-1.5 bg-red-600 rounded z-[2]"
                ></div>
            </div>

            <style jsx>{`
                /* Remove default browser styles */
                .thumb {
                    -webkit-appearance: none;
                    -webkit-tap-highlight-color: transparent;
                }

                .thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    -webkit-tap-highlight-color: transparent;
                    pointer-events: all;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background-color: white;
                    border: 3px solid #dc2626;
                    cursor: pointer;
                    margin-top: 1px; /* Adjust for vertical alignment if needed */
                    box-shadow: 0 0 2px rgba(0,0,0,0.5);
                }
                
                .thumb::-moz-range-thumb {
                    pointer-events: all;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background-color: white;
                    border: 3px solid #dc2626;
                    cursor: pointer;
                    box-shadow: 0 0 2px rgba(0,0,0,0.5);
                    border: none; /* Reset border for Firefox */
                }
            `}</style>
        </div>
    );
}
