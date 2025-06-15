-- Consolidar múltiples políticas UPDATE en clientes para mejorar rendimiento
-- Eliminar solapamiento entre política de usuarios normales y masters

-- Eliminar políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Los usuarios pueden actualizar clientes que crearon" ON public.clientes;
DROP POLICY IF EXISTS "Los usuarios master pueden actualizar cualquier cliente" ON public.clientes;

-- Eliminar también políticas relacionadas en inglés si existen
DROP POLICY IF EXISTS "Users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Masters can update any cliente" ON public.clientes;

-- Crear una sola política UPDATE consolidada que cubra ambos casos
CREATE POLICY "Users can update clientes" ON public.clientes
    FOR UPDATE TO public
    USING (
        -- Caso 1: Usuario normal puede actualizar clientes que creó
        created_by = (SELECT auth.uid())
        OR
        -- Caso 2: Master puede actualizar cualquier cliente
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
        OR
        -- Caso 3: Admin puede actualizar clientes de usuarios de su compañía
        EXISTS (
            SELECT 1 FROM public.users u1, public.users u2
            WHERE u1.id = (SELECT auth.uid())
            AND u2.id = clientes.created_by
            AND u1.role = 'admin'::user_role
            AND u1.company_id = u2.company_id
        )
    );

-- Consolidar también otras políticas para consistencia
-- Eliminar políticas duplicadas en español
DROP POLICY IF EXISTS "Los usuarios autenticados pueden crear clientes" ON public.clientes;
DROP POLICY IF EXISTS "Los usuarios pueden ver clientes activos" ON public.clientes;

-- Eliminar políticas en inglés duplicadas
DROP POLICY IF EXISTS "Users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert clientes" ON public.clientes;

-- Crear políticas consolidadas optimizadas

-- Política SELECT consolidada
CREATE POLICY "Users can view clientes" ON public.clientes
    FOR SELECT TO public
    USING (
        is_active = true
        AND (
            -- Usuario puede ver clientes que creó
            created_by = (SELECT auth.uid())
            OR
            -- Master puede ver todos los clientes
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid()) 
                AND u.role = 'master'::user_role
            )
            OR
            -- Admin puede ver clientes de usuarios de su compañía
            EXISTS (
                SELECT 1 FROM public.users u1, public.users u2
                WHERE u1.id = (SELECT auth.uid())
                AND u2.id = clientes.created_by
                AND u1.role = 'admin'::user_role
                AND u1.company_id = u2.company_id
            )
        )
    );

-- Política INSERT consolidada
CREATE POLICY "Users can insert clientes" ON public.clientes
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

-- Política DELETE (solo masters)
DROP POLICY IF EXISTS "Masters can delete clientes" ON public.clientes;
CREATE POLICY "Masters can delete clientes" ON public.clientes
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can update clientes" ON public.clientes IS 
'Política UPDATE consolidada: Usuario actualiza sus clientes, Admin clientes de su compañía, Master cualquier cliente. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view clientes" ON public.clientes IS 
'Política SELECT consolidada: Usuario ve sus clientes, Admin ve clientes de su compañía, Master ve todos. Solo clientes activos.';

COMMENT ON POLICY "Users can insert clientes" ON public.clientes IS 
'Política INSERT consolidada: Usuarios autenticados pueden crear clientes (se asignan como created_by).';

COMMENT ON POLICY "Masters can delete clientes" ON public.clientes IS 
'Política DELETE: Solo masters pueden eliminar clientes.';