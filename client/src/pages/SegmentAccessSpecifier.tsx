// import React, { useState, useCallback, Dispatch, SetStateAction } from 'react';

// // Define the expected types for the component props
// interface SegmentAccessProps {
//     uid: string;
//     isSeg0Approved: boolean;
//     isSeg1Approved: boolean;
//     isSeg2Approved: boolean;
// }

// // NOTE: This is a placeholder for your actual backend API endpoint.
// // The actual implementation should call your server route which updates Firestore.
// const updateSegmentStatus = async (uid: string, segment: string, isApproved: boolean): Promise<boolean> => {
//     console.log(`Sending update for UID: ${uid}, Segment: ${segment}, Status: ${isApproved}`);
//     const apiUrl = `/api/update-segment-status/${uid}`; 
//     try {
//         // Assuming your backend expects a key like 'IsSeg1Approved' or 'IsSeg2Approved'
//         const updateKey = `Is${segment.charAt(0).toUpperCase()}${segment.slice(1)}Approved`;
        
//         const response = await fetch(apiUrl, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ segmentKey: updateKey, status: isApproved })
//         });

//         if (!response.ok) {
//             throw new Error(`Failed to update status. Server responded with ${response.status}`);
//         }
//         console.log("Segment status updated successfully.");
//         return true;
//     } catch (error) {
//         console.error("Error updating segment status:", error);
//         return false;
//     }
// };

// /**
//  * Component to manage participant segment approval status (S0, S1, S2).
//  * @param {SegmentAccessProps} props
//  */
// const SegmentAccessSpecifier = ({ 
//     uid, 
//     isSeg0Approved, 
//     isSeg1Approved: initialIsSeg1Approved, 
//     isSeg2Approved: initialIsSeg2Approved 
// }: SegmentAccessProps) => {
//     // State to manage the mutable segment approvals
//     const [isSeg1Approved, setIsSeg1Approved] = useState<boolean>(initialIsSeg1Approved);
//     const [isSeg2Approved, setIsSeg2Approved] = useState<boolean>(initialIsSeg2Approved);
//     const [isUpdating, setIsUpdating] = useState<boolean>(false);

//     const toggleSegment = useCallback(async (
//         segmentName: string, 
//         currentStatus: boolean, 
//         setStatus: Dispatch<SetStateAction<boolean>>
//     ) => {
//         const newStatus = !currentStatus;
//         setIsUpdating(true);

//         const success = await updateSegmentStatus(uid, segmentName, newStatus);

//         if (success) {
//             setStatus(newStatus);
//         }
//         setIsUpdating(false);
//     }, [uid]);

//     // Helper function for styling segments
//     const getStatusStyles = (isApproved: boolean) => ({
//         text: isApproved ? 'text-green-700' : 'text-red-700',
//         bg: isApproved ? 'bg-green-100' : 'bg-red-100',
//         label: isApproved ? 'Approved' : 'Unapproved',
//     });

//     const seg0Styles = getStatusStyles(isSeg0Approved);
//     const seg1Styles = getStatusStyles(isSeg1Approved);
//     const seg2Styles = getStatusStyles(isSeg2Approved);

//     return (
//         <div className="bg-white rounded-xl shadow-lg p-6 my-6 border-l-4 border-[#125566]">
//             <h3 className="text-xl font-bold text-[#125566] mb-4">Segment Access Control</h3>
//             <p className="text-gray-500 mb-6">Manage the participant's access to key program segments.</p>

//             <div className="space-y-4">
//                 {/* Segment 0 Status (Baseline/Profile) */}
//                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
//                     <div className="font-medium text-gray-800">
//                         Segment 0 (Baseline)
//                     </div>
//                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${seg0Styles.bg} ${seg0Styles.text}`}>
//                         {seg0Styles.label}
//                     </span>
//                 </div>

//                 {/* Segment 1 Control */}
//                 <div className="flex justify-between items-center p-3 bg-white rounded-lg border shadow-sm">
//                     <div className="font-medium text-gray-800">
//                         Segment 1 Access
//                     </div>
//                     <div className="flex items-center space-x-4">
//                         <span className={`px-3 py-1 text-sm font-semibold rounded-full ${seg1Styles.bg} ${seg1Styles.text} w-24 text-center`}>
//                             {seg1Styles.label}
//                         </span>

//                         <button
//                             onClick={() => toggleSegment('seg1', isSeg1Approved, setIsSeg1Approved)}
//                             disabled={isUpdating}
//                             className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
//                                 isSeg1Approved 
//                                     ? 'bg-red-500 hover:bg-red-600 text-white' 
//                                     : 'bg-green-500 hover:bg-green-600 text-white'
//                             } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
//                         >
//                             {isUpdating ? 'Updating...' : isSeg1Approved ? 'Revoke Access' : 'Grant Access'}
//                         </button>
//                     </div>
//                 </div>

//                 {/* Segment 2 Control */}
//                 <div className="flex justify-between items-center p-3 bg-white rounded-lg border shadow-sm">
//                     <div className="font-medium text-gray-800">
//                         Segment 2 Access
//                     </div>
//                     <div className="flex items-center space-x-4">
//                         <span className={`px-3 py-1 text-sm font-semibold rounded-full ${seg2Styles.bg} ${seg2Styles.text} w-24 text-center`}>
//                             {seg2Styles.label}
//                         </span>

//                         <button
//                             onClick={() => toggleSegment('seg2', isSeg2Approved, setIsSeg2Approved)}
//                             disabled={isUpdating}
//                             className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
//                                 isSeg2Approved 
//                                     ? 'bg-red-500 hover:bg-red-600 text-white' 
//                                     : 'bg-green-500 hover:bg-green-600 text-white'
//                             } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
//                         >
//                             {isUpdating ? 'Updating...' : isSeg2Approved ? 'Revoke Access' : 'Grant Access'}
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SegmentAccessSpecifier;
