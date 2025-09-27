import React, { useState, useEffect } from 'react';
import { fetchHadithBooksForCollection, fetchHadithBook } from './api';
import { LoaderIcon, ArrowLeftIcon } from '../Icons';
import { HadithBook } from '../../types';

interface Collection {
    name: string;
    hasbooks: boolean;
    totalhadith: number;
    totalbooks: number;
}

const COLLECTIONS = [
    { name: "bukhari", title: "صحيح البخاري" },
    { name: "muslim", title: "صحيح مسلم" },
    { name: "nasai", title: "سنن النسائي" },
    { name: "abudawud", title: "سنن أبي داود" },
    { name: "tirmidhi", title: "جامع الترمذي" },
    { name: "ibnmajah", title: "سنن ابن ماجه" },
];

export const HadithReader: React.FC = () => {
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [books, setBooks] = useState<{name: string, book_number: string}[]>([]);
    const [selectedBook, setSelectedBook] = useState<HadithBook | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (selectedCollection) {
            const getBooks = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await fetchHadithBooksForCollection(selectedCollection);
                    setBooks(data);
                } catch (err) {
                    setError('فشل في جلب قائمة الكتب. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
                } finally {
                    setIsLoading(false);
                }
            };
            getBooks();
        }
    }, [selectedCollection]);
    
    const handleSelectBook = async (bookNumber: string, bookName: string) => {
        if (!selectedCollection) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchHadithBook(selectedCollection, bookNumber);
            setSelectedBook({ ...data, name: bookName }); // Add bookName to the fetched data
        } catch (err) {
            setError('فشل في جلب الأحاديث.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><LoaderIcon className="w-8 h-8 animate-spin text-green-500" /></div>;
    }

    if (error) {
         return <div className="flex h-full items-center justify-center p-4 text-center text-red-500 bg-red-500/10">{error}</div>;
    }

    if (selectedBook) {
        return (
            <div className="h-full flex flex-col">
                <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0">
                    <button onClick={() => setSelectedBook(null)} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                    <h3 className="font-bold text-lg truncate">{selectedBook.name}</h3>
                </header>
                <div className="p-4 overflow-y-auto space-y-4">
                    {selectedBook.hadiths.map(hadith => (
                        <div key={hadith.hadithnumber} className="p-4 bg-white/50 dark:bg-black/10 rounded-lg">
                            <p className="font-semibold mb-2 text-green-700 dark:text-green-300">حديث رقم: {hadith.hadithnumber}</p>
                            <p className="leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{hadith.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (selectedCollection) {
        return (
             <div className="h-full flex flex-col">
                 <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0">
                    <button onClick={() => setSelectedCollection(null)} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                    <h2 className="font-bold text-xl">{COLLECTIONS.find(c => c.name === selectedCollection)?.title}</h2>
                </header>
                <div className="p-2 overflow-y-auto">
                    {books.map((book: any, index: number) => (
                        <button key={index} onClick={() => handleSelectBook(book.book_number, book.name)} className="w-full text-right p-3 rounded-lg hover:bg-[var(--token-main-surface-tertiary)] transition-colors">
                            {book.name}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 quran-background dark:quran-background">
            <h1 className="text-2xl font-bold text-center text-amber-800 dark:text-amber-200 mb-6">كتب الحديث الشريف</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {COLLECTIONS.map(collection => (
                    <button 
                        key={collection.name} 
                        onClick={() => setSelectedCollection(collection.name)}
                        className="p-4 aspect-square flex flex-col justify-center items-center text-center gap-2 bg-white/50 dark:bg-black/20 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-yellow-300/50 dark:border-yellow-600/50"
                    >
                        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">{collection.title}</h2>
                    </button>
                ))}
            </div>
        </div>
    );
};