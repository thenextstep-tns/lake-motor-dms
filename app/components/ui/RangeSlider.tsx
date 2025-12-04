'use client';

import { useEffect, useRef, useCallback } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
}

export default function RangeSlider({ min, max, value, onChange, step = 1 }: RangeSliderProps) {
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = useCallback((val: number) => Math.round(((val - min) / (max - min)) * 100), [min, max]);

    // Update range width and position
    useEffect(() => {
        const minPercent = getPercent(value[0]);
        const maxPercent = getPercent(value[1]);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [value, getPercent]);

    return (
        <div className="relative w-full h-6 flex items-center justify-center">
            <input
                type="range"
                min={min}
                max={max}
                value={value[0]}
                step={step}
                onChange={(event) => {
                    const newVal = Math.min(Number(event.target.value), value[1] - 1);
                    onChange([newVal, value[1]]);
                }}
                className="thumb thumb--left pointer-events-none absolute h-0 w-full outline-none z-[3] appearance-none"
                style={{ zIndex: value[0] > max - 100 ? 5 : 3 }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={value[1]}
                step={step}
                onChange={(event) => {
                    const newVal = Math.max(Number(event.target.value), value[0] + 1);
                    onChange([value[0], newVal]);
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
