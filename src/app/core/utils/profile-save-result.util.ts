import { HttpResponse } from '@angular/common/http';
import { ResponseHandlerUtil } from './response-handler.util';
import { ProfileChangeRequest, ProfileSaveResult } from '../models/profile-change.model';

/**
 * PATCH .../profile отвечает 200 (админ, тело — сама сущность) или 202 (владелец, тело —
 * заявка в очередь модерации, BASE_FIXES_TASK.md §2.5). Различаем по статусу, а не по форме
 * тела — оба варианта проходят через один и тот же ResponseHandler.
 */
export function toProfileSaveResult<T>(response: HttpResponse<unknown>): ProfileSaveResult<T> {
    if (response.status === 202) {
        const pendingRequest = ResponseHandlerUtil.extractData<ProfileChangeRequest>(response.body);
        return { applied: false, pendingRequest };
    }
    const entity = ResponseHandlerUtil.extractData<T>(response.body);
    return { applied: true, entity };
}
