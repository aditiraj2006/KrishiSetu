import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { User, Edit3, Globe, Bell, Shield, Sprout, Truck, Store, Users } from 'lucide-react';

const roles = [
  { id: 'farmer', title: 'Farmer', icon: Sprout, color: 'bg-primary' },
  { id: 'distributor', title: 'Distributor', icon: Truck, color: 'bg-accent' },
  { id: 'retailer', title: 'Retailer', icon: Store, color: 'bg-warning' },
  { id: 'consumer', title: 'Consumer', icon: Users, color: 'bg-verified' }
];

const languages = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'de', name: 'Deutsch' },
  { id: 'zh', name: '中文' },
  { id: 'hi', name: 'हिंदी' },
  { id: 'pt', name: 'Português' }
];

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url("Invalid website URL").or(z.literal("")),
  role: z.string(),
  language: z.string(),
  notificationsEnabled: z.boolean()
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      location: user?.location || '',
      bio: user?.bio || '',
      website: user?.website || '',
      role: user?.role || 'farmer',
      language: user?.language || 'en',
      notificationsEnabled: user?.notificationsEnabled !== false
    }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        location: user.location || '',
        bio: user.bio || '',
        website: user.website || '',
        role: user.role || 'farmer',
        language: user.language || 'en',
        notificationsEnabled: user.notificationsEnabled !== false
      });
    }
  }, [user, form]);

  if (!user || !firebaseUser) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Please sign in to view your profile</h2>
          </div>
        </div>
      </div>
    );
  }

  const currentRole = roles.find(r => r.id === user.role);
  const RoleIcon = currentRole?.icon || User;

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      await apiRequest('PUT', `/api/user/profile`, data);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Profile Settings</h2>
          <p className="text-muted-foreground mt-1">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm border border-border">
              <CardHeader className="text-center pb-4">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={firebaseUser.photoURL || undefined} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-foreground" data-testid="text-profile-name">
                  {user.name}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-email">
                  {user.email}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-username">
                  @{user.username}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Role</span>
                  <Badge className={`${currentRole?.color} text-white flex items-center gap-1`}>
                    <RoleIcon className="w-3 h-3" />
                    {currentRole?.title}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Language</span>
                  <span className="text-sm text-muted-foreground">
                    {languages.find(l => l.id === user.language)?.name || 'English'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Member Since</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt!).toLocaleDateString()}
                  </span>
                </div>

                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-verified" />
                    <span className="text-sm font-medium text-foreground">Verified Account</span>
                  </div>
                  <Badge variant="outline" className="bg-verified/10 text-verified border-verified/20">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                      data-testid="button-edit-profile"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={true}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="tel"
                                disabled={!isEditing}
                                placeholder="+1 (555) 123-4567"
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company/Organization</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                placeholder="Acme Farm Co."
                                data-testid="input-company"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                placeholder="City, State/Country"
                                data-testid="input-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="url"
                                disabled={!isEditing}
                                placeholder="https://example.com"
                                data-testid="input-website"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ''}
                              disabled={!isEditing}
                              placeholder="Tell us about yourself..."
                              className="min-h-20"
                              data-testid="textarea-bio"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Preferences
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role in Supply Chain</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={!isEditing}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-role">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      <div className="flex items-center gap-2">
                                        <role.icon className="w-4 h-4" />
                                        {role.title}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Language</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={!isEditing}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-language">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {languages.map((lang) => (
                                    <SelectItem key={lang.id} value={lang.id}>
                                      {lang.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notificationsEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Email Notifications
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Receive alerts about product updates, price changes, and supply chain activities
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!isEditing}
                                data-testid="switch-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            form.reset();
                          }}
                          disabled={isUpdating}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isUpdating}
                          data-testid="button-save-profile"
                        >
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}