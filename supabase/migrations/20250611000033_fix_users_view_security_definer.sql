-- Corregir la vista users_view para que use SECURITY INVOKER en lugar de SECURITY DEFINER
-- Esto asegura que se apliquen los permisos del usuario que consulta, no del creador

-- Eliminar la vista existente
DROP VIEW IF EXISTS public.users_view;

-- Recrear la vista con SECURITY INVOKER (comportamiento por defecto)
CREATE VIEW public.users_view
WITH (security_invoker = true) AS
SELECT 
    u.id, 
    u.email, 
    u.full_name, 
    u.role,
    u.company_id,
    u.created_at, 
    u.updated_at,
    c.name as company_name
FROM public.users u
LEFT JOIN public.companies c ON c.id = u.company_id
WHERE 
    -- Usuario puede ver su propio perfil
    u.id = (SELECT auth.uid()) 
    OR 
    -- Admin puede ver usuarios de su compañía
    EXISTS (
        SELECT 1 FROM public.users curr_user 
        WHERE curr_user.id = (SELECT auth.uid()) 
        AND curr_user.role IN ('admin'::user_role, 'master'::user_role)
        AND (
            curr_user.company_id = u.company_id 
            OR curr_user.role = 'master'::user_role
        )
    );

-- Agregar comentario explicativo
COMMENT ON VIEW public.users_view IS 
'Vista de usuarios con SECURITY INVOKER para aplicar RLS del usuario consultante. Muestra información básica de usuarios según permisos.';

-- Asegurar que los permisos de la vista sean correctos
GRANT SELECT ON public.users_view TO authenticated;
GRANT SELECT ON public.users_view TO anon;