import React from "react";

const ResponseCard = ({ data }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-600">
            <p className="text-gray-600 mb-2">
                <span className="font-semibold">You:</span> {data.input}
            </p>
            <p className="text-gray-800">
                <span className="font-semibold text-indigo-600">AI:</span> {data.message}
            </p>
        </div>
    );
};

export default ResponseCard;
