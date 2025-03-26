import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Globe, Bell, Shield, Database, Clock } from 'lucide-react';

const generalFormSchema = z.object({
  appName: z.string().min(2, {
    message: "El nombre de la aplicación debe tener al menos 2 caracteres",
  }),
  logoUrl: z.string().optional(),
  companyName: z.string().min(2, {
    message: "El nombre de la empresa debe tener al menos 2 caracteres",
  }),
  enableDebugMode: z.boolean().default(false),
});

const emailFormSchema = z.object({
  smtpServer: z.string().min(2, {
    message: "El servidor SMTP es requerido",
  }),
  smtpPort: z.string().min(1, {
    message: "El puerto SMTP es requerido",
  }),
  smtpUser: z.string().min(2, {
    message: "El usuario SMTP es requerido",
  }),
  smtpPassword: z.string().min(1, {
    message: "La contraseña SMTP es requerida",
  }),
  senderEmail: z.string().email({
    message: "Debe ingresar un email válido",
  }),
  enableEmailNotifications: z.boolean().default(true),
});

const securityFormSchema = z.object({
  sessionTimeout: z.string().min(1, {
    message: "El tiempo de sesión es requerido",
  }),
  maxLoginAttempts: z.string().min(1, {
    message: "El número máximo de intentos de login es requerido",
  }),
  enforceStrongPasswords: z.boolean().default(true),
  enableTwoFactorAuth: z.boolean().default(false),
});

const timezoneFormSchema = z.object({
  timezone: z.string().min(1, {
    message: "La zona horaria es requerida",
  }),
  dateFormat: z.string().min(1, {
    message: "El formato de fecha es requerido",
  }),
  timeFormat: z.string().min(1, {
    message: "El formato de hora es requerido",
  }),
  useLocalTime: z.boolean().default(true),
});

const initialConfig = {
  general: {
    appName: "Encuestas VA",
    logoUrl: "",
    companyName: "Encuestas VA Inc.",
    enableDebugMode: false,
  },
  email: {
    smtpServer: "smtp.example.com",
    smtpPort: "587",
    smtpUser: "notificaciones",
    smtpPassword: "********",
    senderEmail: "notificaciones@encuestasva.com",
    enableEmailNotifications: true,
  },
  security: {
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    enforceStrongPasswords: true,
    enableTwoFactorAuth: false,
  },
  timezone: {
    timezone: "America/Lima",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm:ss",
    useLocalTime: true,
  }
};

export function ConfigurationManager() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: initialConfig.general,
  });
  
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: initialConfig.email,
  });
  
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: initialConfig.security,
  });
  
  const timezoneForm = useForm<z.infer<typeof timezoneFormSchema>>({
    resolver: zodResolver(timezoneFormSchema),
    defaultValues: initialConfig.timezone,
  });
  
  const onSubmitGeneral = async (values: z.infer<typeof generalFormSchema>) => {
    handleSubmit(values, "general");
  };
  
  const onSubmitEmail = async (values: z.infer<typeof emailFormSchema>) => {
    handleSubmit(values, "email");
  };
  
  const onSubmitSecurity = async (values: z.infer<typeof securityFormSchema>) => {
    handleSubmit(values, "security");
  };
  
  const onSubmitTimezone = async (values: z.infer<typeof timezoneFormSchema>) => {
    handleSubmit(values, "timezone");
  };
  
  const handleSubmit = async (values: any, section: string) => {
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saving ${section} settings:`, values);
      
      toast.success(`Configuración de ${getTabTitle(section)} guardada correctamente`);
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast.error(`Error al guardar la configuración de ${getTabTitle(section)}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getTabTitle = (tab: string): string => {
    switch (tab) {
      case "general": return "General";
      case "email": return "Correo Electrónico";
      case "security": return "Seguridad";
      case "timezone": return "Fecha y Hora";
      default: return "";
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="general" className="flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Correo</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="timezone" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Fecha/Hora</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Configura los ajustes básicos de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-4">
                  <FormField
                    control={generalForm.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Aplicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Encuestas VA" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este nombre se mostrará en el título de la aplicación y correos electrónicos.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del Logo</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL del logo que se mostrará en la aplicación (opcional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Encuestas VA Inc." {...field} />
                        </FormControl>
                        <FormDescription>
                          Nombre de la empresa propietaria de la aplicación.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="enableDebugMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Modo de Depuración</FormLabel>
                          <FormDescription>
                            Activa mensajes de depuración detallados (solo para desarrollo).
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="btn-admin w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Correo Electrónico</CardTitle>
              <CardDescription>
                Configura los ajustes para el envío de notificaciones por correo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="smtpServer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servidor SMTP</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puerto SMTP</FormLabel>
                          <FormControl>
                            <Input placeholder="587" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuario SMTP</FormLabel>
                          <FormControl>
                            <Input placeholder="usuario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña SMTP</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={emailForm.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo del Remitente</FormLabel>
                        <FormControl>
                          <Input placeholder="notificaciones@encuestasva.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Dirección de correo que aparecerá como remitente.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={emailForm.control}
                    name="enableEmailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Notificaciones por Correo</FormLabel>
                          <FormDescription>
                            Activar envío de notificaciones por correo electrónico.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="btn-admin w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>
                Configura los ajustes de seguridad y autenticación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSubmitSecurity)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo de Sesión (minutos)</FormLabel>
                          <FormControl>
                            <Input placeholder="60" {...field} />
                          </FormControl>
                          <FormDescription>
                            Tiempo en minutos antes de que expire la sesión.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="maxLoginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intentos Máximos de Login</FormLabel>
                          <FormControl>
                            <Input placeholder="5" {...field} />
                          </FormControl>
                          <FormDescription>
                            Número de intentos fallidos antes de bloquear el acceso.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={securityForm.control}
                    name="enforceStrongPasswords"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Exigir Contraseñas Seguras</FormLabel>
                          <FormDescription>
                            Requerir contraseñas con mayúsculas, números y caracteres especiales.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="enableTwoFactorAuth"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Autenticación de Dos Factores</FormLabel>
                          <FormDescription>
                            Activar verificación adicional al iniciar sesión.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="btn-admin w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timezone">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Fecha y Hora</CardTitle>
              <CardDescription>
                Configura la zona horaria y el formato de fecha y hora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...timezoneForm}>
                <form onSubmit={timezoneForm.handleSubmit(onSubmitTimezone)} className="space-y-4">
                  <FormField
                    control={timezoneForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona Horaria</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una zona horaria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/Lima">Perú (Lima) GMT-5</SelectItem>
                            <SelectItem value="America/Bogota">Colombia (Bogotá) GMT-5</SelectItem>
                            <SelectItem value="America/Santiago">Chile (Santiago) GMT-4</SelectItem>
                            <SelectItem value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires) GMT-3</SelectItem>
                            <SelectItem value="America/Mexico_City">México (Ciudad de México) GMT-6</SelectItem>
                            <SelectItem value="Europe/Madrid">España (Madrid) GMT+1</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Configura la zona horaria predeterminada del sistema.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={timezoneForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formato de Fecha</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un formato de fecha" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dd/MM/yyyy">DD/MM/AAAA (31/12/2023)</SelectItem>
                              <SelectItem value="MM/dd/yyyy">MM/DD/AAAA (12/31/2023)</SelectItem>
                              <SelectItem value="yyyy-MM-dd">AAAA-MM-DD (2023-12-31)</SelectItem>
                              <SelectItem value="dd 'de' MMMM 'de' yyyy">DD de Mes de AAAA (31 de Diciembre de 2023)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={timezoneForm.control}
                      name="timeFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formato de Hora</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un formato de hora" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="HH:mm:ss">24 horas (14:30:00)</SelectItem>
                              <SelectItem value="hh:mm:ss a">12 horas (02:30:00 PM)</SelectItem>
                              <SelectItem value="HH:mm">24 horas sin segundos (14:30)</SelectItem>
                              <SelectItem value="hh:mm a">12 horas sin segundos (02:30 PM)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={timezoneForm.control}
                    name="useLocalTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Usar Hora Local de Lima (GMT-5)</FormLabel>
                          <FormDescription>
                            Todos los registros y visualizaciones usarán la hora oficial de Perú (Lima).
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="btn-admin w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="p-4 rounded-lg bg-muted">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Los cambios en la configuración afectan a todos los usuarios del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
