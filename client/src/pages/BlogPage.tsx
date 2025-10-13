import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase'; // Assuming your Firebase db instance is exported from this path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Blog {
    id: string; // Firestore document ID
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    isPublished: boolean;
    createdAt: Timestamp;
    author?: string;
}

const CATEGORIES = [
    'Hormone disruptor',
    'Donor egg LVF',
    'Egg freezing',
    'Fertility blog and information',
    'Gestational surrogacy',
    'In vitro fertilization',
    'Intrauterine insemination (IUI)',
];

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formState, setFormState] = useState({
        id: '', // This will hold the Firestore doc ID for editing
        title: '',
        description: '',
        imageUrl: '',
        category: '',
        isPublished: false,
        author: 'Admin',
    });
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // We will sort by createdAt in descending order to get the newest blogs first
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedBlogs: Blog[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        imageUrl: data.imageUrl,
                        category: data.category,
                        isPublished: data.isPublished,
                        createdAt: data.createdAt,
                        author: data.author,
                    };
                });
                setBlogs(fetchedBlogs);
                setIsLoading(false);
            },
            (error) => {
                console.error('Error fetching blogs: ', error);
                toast({
                    title: 'Error!',
                    description: 'Failed to load blogs. Please try again.',
                    variant: 'destructive',
                });
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState({ ...formState, [name]: value });
    };

    const handleSelectChange = (value: string) => {
        setFormState({ ...formState, category: value });
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormState({ ...formState, isPublished: checked });
    };

    const validateForm = () => {
        const { title, description, imageUrl, category } = formState;
        if (!title || !description || !imageUrl || !category) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return false;
        }
        return true;
    };

    const handleAddBlog = async () => {
        if (!validateForm()) return;
        try {
            await addDoc(collection(db, 'blogs'), {
                title: formState.title,
                description: formState.description,
                imageUrl: formState.imageUrl,
                category: formState.category,
                isPublished: formState.isPublished,
                createdAt: Timestamp.now(),
                author: formState.author,
            });
            
            toast({ title: 'Success!', description: 'New blog added successfully.' });
            resetForm();
        } catch (e) {
            console.error('Error adding document: ', e);
            toast({
                title: 'Error!',
                description: 'Failed to add blog. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateBlog = async () => {
        if (!validateForm()) return;
        try {
            const blogDocRef = doc(db, 'blogs', formState.id);
            await updateDoc(blogDocRef, {
                title: formState.title,
                description: formState.description,
                imageUrl: formState.imageUrl,
                category: formState.category,
                isPublished: formState.isPublished,
            });
            toast({ title: 'Success!', description: 'Blog updated successfully.' });
            resetForm();
        } catch (e) {
            console.error('Error updating document: ', e);
            toast({
                title: 'Error!',
                description: 'Failed to update blog. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteBlog = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'blogs', id));
            toast({
                title: 'Success!',
                description: 'Blog deleted successfully.',
            });
        } catch (e) {
            console.error('Error removing document: ', e);
            toast({
                title: 'Error!',
                description: 'Failed to delete blog. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleEditBlog = (blog: Blog) => {
        setFormState({
            id: blog.id,
            title: blog.title,
            description: blog.description,
            imageUrl: blog.imageUrl,
            category: blog.category,
            isPublished: blog.isPublished,
            author: blog.author || 'Admin',
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormState({
            id: '',
            title: '',
            description: '',
            imageUrl: '',
            category: '',
            isPublished: false,
            author: 'Admin',
        });
        setIsEditing(false);
    };

    return (
        <div className="font-poppins bg-gray-50 min-h-screen">
            <Header
                title="Blog Management"
                subtitle="Create, edit, and publish blog posts."
            />

            <main className="p-6 pt-0 max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card className="shadow-lg sticky top-6">
                        <CardHeader>
                            <CardTitle>{isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => { e.preventDefault(); isEditing ? handleUpdateBlog() : handleAddBlog(); }} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" value={formState.title} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" value={formState.description} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <Label htmlFor="imageUrl">Image URL</Label>
                                    <Input id="imageUrl" name="imageUrl" value={formState.imageUrl} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select onValueChange={handleSelectChange} value={formState.category}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isPublished"
                                        checked={formState.isPublished}
                                        onCheckedChange={handleSwitchChange}
                                    />
                                    <Label htmlFor="isPublished">{formState.isPublished ? 'Published' : 'Draft'}</Label>
                                </div>
                                <div className="flex space-x-2">
                                    <Button type="submit">{isEditing ? 'Update Blog' : 'Add Blog'}</Button>
                                    {isEditing && (
                                        <Button type="button" variant="outline" onClick={resetForm}>
                                            Cancel Edit
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Existing Blogs</h2>
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="shadow-sm p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-4 w-5/6" />
                                <div className="flex space-x-2 mt-4">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            </Card>
                        ))
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-12 bg-gray-100 rounded-lg">
                            <p className="text-gray-500">No blogs found. Start by adding a new one!</p>
                        </div>
                    ) : (
                        blogs.map((blog, index) => (
                            <Card key={blog.id} className="shadow-sm p-4 flex items-center justify-between gap-4">
                                {/* Image container */}
                                {blog.imageUrl && (
                                    <div className="flex-shrink-0 relative w-20 h-20 overflow-hidden rounded-md bg-gray-100">
                                        <img
                                            src={blog.imageUrl}
                                            alt={blog.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image'; }}
                                        />
                                    </div>
                                )}
                                
                                {/* Content container */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <span
                                            className={`h-2 w-2 rounded-full ${blog.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}
                                        ></span>
                                        <h4 className="text-lg font-semibold text-gray-800 truncate">
                                            {`Blog ${blogs.length - index}:`} {blog.title}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{blog.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">Category: {blog.category}</p>
                                    <p className="text-xs text-gray-400 mt-1">Status: {blog.isPublished ? 'Published' : 'Draft'}</p>
                                </div>

                                {/* Buttons container */}
                                <div className="flex-shrink-0 flex space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEditBlog(blog)}>
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDeleteBlog(blog.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}