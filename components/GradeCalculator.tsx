import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon } from './Icons';

interface Subject {
    name: string;
    coeff: number;
    activities: string;
    test1: string;
    exam: string;
}

const INITIAL_SUBJECTS: Subject[] = [
    { name: 'اللغة العربية', coeff: 5, activities: '', test1: '', exam: '' },
    { name: 'الرياضيات', coeff: 4, activities: '', test1: '', exam: '' },
    { name: 'اللغة الفرنسية', coeff: 4, activities: '', test1: '', exam: '' },
    { name: 'اللغة الإنجليزية', coeff: 3, activities: '', test1: '', exam: '' },
    { name: 'التاريخ والجغرافيا', coeff: 3, activities: '', test1: '', exam: '' },
    { name: 'ع. الطبيعة والحياة', coeff: 2, activities: '', test1: '', exam: '' },
    { name: 'ع. الفيزيائية والتكنولوجيا', coeff: 2, activities: '', test1: '', exam: '' },
    { name: 'التربية الإسلامية', coeff: 2, activities: '', test1: '', exam: '' },
    { name: 'اللغة الأمازيغية', coeff: 2, activities: '', test1: '', exam: '' },
    { name: 'التربية المدنية', coeff: 1, activities: '', test1: '', exam: '' },
    { name: 'الاعلام الآلي', coeff: 2, activities: '', test1: '', exam: '' },
    { name: 'التربية التشكيلية', coeff: 1, activities: '', test1: '', exam: '' },
    { name: 'ت. البدنية والرياضية', coeff: 1, activities: '', test1: '', exam: '' },
];

interface GradeCalculatorProps {
    onBack: () => void;
}

export const GradeCalculator: React.FC<GradeCalculatorProps> = ({ onBack }) => {
    const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
    const [showResults, setShowResults] = useState(false);

    const handleInputChange = (index: number, field: 'activities' | 'test1' | 'exam', value: string) => {
        const newSubjects = [...subjects];
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            newSubjects[index] = { ...newSubjects[index], [field]: value };
            setSubjects(newSubjects);
        }
    };
    
    const handleCoeffChange = (index: number, value: string) => {
        const newSubjects = [...subjects];
        if (value === '') {
            newSubjects[index] = { ...newSubjects[index], coeff: 0 };
            setSubjects(newSubjects);
            return;
        }
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
            newSubjects[index] = { ...newSubjects[index], coeff: numValue };
            setSubjects(newSubjects);
        }
    };


    const calculationResults = useMemo(() => {
        let overallTotalPoints = 0;
        let overallTotalCoeffs = 0;

        const subjectsWithAvg = subjects.map(subject => {
            const activities = parseFloat(subject.activities) || 0;
            const test1 = parseFloat(subject.test1) || 0;
            const exam = parseFloat(subject.exam) || 0;
            const coeff = subject.coeff || 0;

            const continuousAssessmentAvg = (activities + test1) / 2;
            const subjectAvg = (continuousAssessmentAvg + exam) / 3;
            const subjectTotal = subjectAvg * coeff;

            if (coeff > 0) {
                overallTotalPoints += subjectTotal;
                overallTotalCoeffs += coeff;
            }
            
            return {
                ...subject,
                subjectAvg: subjectAvg.toFixed(2),
                subjectTotal: subjectTotal.toFixed(2)
            };
        });

        const finalAverage = (overallTotalCoeffs > 0) ? (overallTotalPoints / overallTotalCoeffs) : 0;

        return {
            subjectsWithAvg,
            finalAverage: finalAverage.toFixed(2),
            overallTotalPoints: overallTotalPoints.toFixed(2),
            overallTotalCoeffs
        };
    }, [subjects]);
    
    const handleCalculate = () => {
        setShowResults(true);
    };

    const handleReset = () => {
        // Create a deep copy to avoid reference issues
        setSubjects(JSON.parse(JSON.stringify(INITIAL_SUBJECTS)));
        setShowResults(false);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#131314] text-gray-800 dark:text-gray-200" style={{fontFamily: "'Tajawal', sans-serif"}}>
            <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0 bg-[var(--token-main-surface-primary)]">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                <h1 className="text-xl font-bold">حاسبة المعدل الدراسي</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                 <div className="card p-4 sm:p-6 md:p-8 max-w-7xl mx-auto bg-white dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full w-full text-center">
                            <thead className="text-sm">
                                <tr className="table-header">
                                    <th className="p-3 rounded-tr-lg">المادة</th>
                                    <th className="p-3">تقويم النشاطات</th>
                                    <th className="p-3">الفرض 1</th>
                                    <th className="p-3">الاختبار (على 40)</th>
                                    <th className="p-3">المعامل</th>
                                    <th className="p-3">معدل المادة</th>
                                    <th className="p-3 rounded-tl-lg">المجموع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {calculationResults.subjectsWithAvg.map((subject, index) => (
                                     <tr key={index}>
                                        <td className="p-2 font-semibold text-gray-700 dark:text-gray-300">{subject.name}</td>
                                        <td className="p-2"><input type="number" value={subject.activities} onChange={e => handleInputChange(index, 'activities', e.target.value)} className="form-input bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" placeholder="20" min="0" max="20" step="0.25" /></td>
                                        <td className="p-2"><input type="number" value={subject.test1} onChange={e => handleInputChange(index, 'test1', e.target.value)} className="form-input bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" placeholder="20" min="0" max="20" step="0.25" /></td>
                                        <td className="p-2"><input type="number" value={subject.exam} onChange={e => handleInputChange(index, 'exam', e.target.value)} className="form-input bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" placeholder="40" min="0" max="40" step="0.25" /></td>
                                        <td className="p-2"><input type="number" value={subject.coeff} onChange={e => handleCoeffChange(index, e.target.value)} className="form-input bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" min="0" max="10" step="1" /></td>
                                        <td className="p-2 font-bold text-blue-600 dark:text-blue-400">{subject.subjectAvg}</td>
                                        <td className="p-2 font-bold text-gray-800 dark:text-gray-200">{subject.subjectTotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <button onClick={handleCalculate} className="btn w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm-3 2a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 0a1 1 0 100 2h.01a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                            احسب المعدل
                        </button>
                        <button onClick={handleReset} className="btn w-full sm:w-auto bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                            إعادة تعيين
                        </button>
                    </div>

                    {showResults && (
                        <div className="mt-8 text-center animate-fade-in">
                            <div className="result-display inline-block">
                                <h3 className="text-xl font-bold">المعدل الفصلي: <span className="text-2xl">{calculationResults.finalAverage}</span></h3>
                                <p className="text-sm mt-1">المجموع الكلي: <span>{calculationResults.overallTotalPoints}</span> / مجموع المعاملات: <span>{calculationResults.overallTotalCoeffs}</span></p>
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};