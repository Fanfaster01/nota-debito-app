-- Consolidar múltiples políticas INSERT en depositos_bancarios para mejorar rendimiento
-- Eliminar solapamiento entre políticas de Master y Admin

-- Eliminar todas las políticas INSERT existentes que se solapan
DROP POLICY IF EXISTS "Masters can insert depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Admins can insert own company depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Users can insert own company depositos_bancarios" ON public.depositos_bancarios;

-- Crear una sola política INSERT consolidada que cubra ambos casos
CREATE POLICY "Users can insert depositos_bancarios" ON public.depositos_bancarios
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND (
            -- Caso 1: Master puede insertar para cualquier compañía
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid()) 
                AND u.role = 'master'::user_role
            )
            OR
            -- Caso 2: Admin puede insertar solo para su compañía
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid()) 
                AND u.role = 'admin'::user_role
                AND u.company_id = depositos_bancarios.company_id
            )
        )
    );

-- Consolidar también otras políticas para consistencia
-- Políticas SELECT
DROP POLICY IF EXISTS "Admins can view own company depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Masters can view all depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Users can view own company depositos_bancarios" ON public.depositos_bancarios;

-- Crear una sola política SELECT consolidada
CREATE POLICY "Users can view depositos_bancarios" ON public.depositos_bancarios
    FOR SELECT TO authenticated
    USING (
        -- Master puede ver todos
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
        OR
        -- Admin puede ver de su compañía
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'admin'::user_role
            AND u.company_id = depositos_bancarios.company_id
        )
    );

-- Políticas UPDATE
DROP POLICY IF EXISTS "Admins can update own company depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Masters can update all depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Users can update own company depositos_bancarios" ON public.depositos_bancarios;

-- Crear una sola política UPDATE consolidada
CREATE POLICY "Users can update depositos_bancarios" ON public.depositos_bancarios
    FOR UPDATE TO authenticated
    USING (
        -- Master puede actualizar todos
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
        OR
        -- Admin puede actualizar de su compañía
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'admin'::user_role
            AND u.company_id = depositos_bancarios.company_id
        )
    )
    WITH CHECK (
        -- Misma lógica para WITH CHECK
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'admin'::user_role
            AND u.company_id = depositos_bancarios.company_id
        )
    );

-- Política DELETE (solo masters)
DROP POLICY IF EXISTS "Masters can delete depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Admins can delete depositos_bancarios" ON public.depositos_bancarios;

CREATE POLICY "Masters can delete depositos_bancarios" ON public.depositos_bancarios
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can insert depositos_bancarios" ON public.depositos_bancarios IS 
'Política INSERT consolidada: Master puede insertar para cualquier compañía, Admin solo para su compañía. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view depositos_bancarios" ON public.depositos_bancarios IS 
'Política SELECT consolidada: Master ve todos, Admin ve solo de su compañía.';

COMMENT ON POLICY "Users can update depositos_bancarios" ON public.depositos_bancarios IS 
'Política UPDATE consolidada: Master puede actualizar todos, Admin solo de su compañía.';

COMMENT ON POLICY "Masters can delete depositos_bancarios" ON public.depositos_bancarios IS 
'Política DELETE: Solo masters pueden eliminar depósitos bancarios.';