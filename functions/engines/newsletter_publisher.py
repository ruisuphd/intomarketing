import os
from datetime import datetime, timezone

from shared.firestore_client import get_tenant, query_docs, update_doc
from shared.logger import get_logger
from shared.newsletter_providers import publish_to_beehiiv, publish_to_ghost
from shared.secrets import get_secret_or_env

logger = get_logger("engine.newsletter_publisher")


async def publish_newsletters():
    """Query scheduled NewsletterCampaigns and publish to Ghost/Beehiiv/Substack."""
    logger.info("newsletter_publisher.publish_newsletters.start")
    now = datetime.now(timezone.utc)

    try:
        tenant_docs = query_docs("tenants", tenant_id=None)
        campaigns: list[tuple[str, dict]] = []
        for t in tenant_docs:
            tenant_id = t.get("tenant_id") or t.get("id")
            if not tenant_id:
                continue
            for c in query_docs(
                "newsletter_campaigns",
                filters=[("status", "==", "scheduled")],
                tenant_id=tenant_id,
            ):
                if (c.get("scheduled_at") or now) <= now:
                    campaigns.append((tenant_id, c))

        if not campaigns:
            logger.info("newsletter_publisher.publish_newsletters.no_campaigns")
            return

        for tenant_id, campaign in campaigns:
            campaign_id = campaign.get("id")
            platform = campaign.get("platform", "")
            subject = campaign.get("subject", "Newsletter")
            html_body = campaign.get("html_body", "")

            if platform == "ghost":
                ghost_url = os.getenv("GHOST_DEFAULT_URL")
                ghost_key = os.getenv("GHOST_DEFAULT_KEY")
                if tenant_id:
                    tenant_doc = get_tenant(tenant_id)
                    if tenant_doc:
                        ghost_url = tenant_doc.get("ghost_url") or ghost_url
                        ghost_key = tenant_doc.get("ghost_admin_key") or ghost_key
                if ghost_url and ghost_key:
                    ext_id, err = await publish_to_ghost(
                        ghost_url, ghost_key, subject, html_body or "<p></p>"
                    )
                    if err:
                        logger.warning(
                            "newsletter_publisher.ghost_failed",
                            extra={"campaign_id": campaign_id, "error": err},
                        )
                        if tenant_id:
                            update_doc(
                                "newsletter_campaigns",
                                campaign_id,
                                {"status": "failed", "error_message": err},
                                tenant_id=tenant_id,
                            )
                        continue
                else:
                    logger.info(
                        "newsletter_publisher.ghost_skipped",
                        extra={
                            "campaign_id": campaign_id,
                            "reason": "Ghost not configured",
                        },
                    )

            elif platform == "beehiiv":
                api_key = get_secret_or_env(
                    secret_id="beehiiv-api-key", env_var="BEEHIIV_API_KEY"
                ) or ""
                tenant_doc = get_tenant(tenant_id) if tenant_id else None
                pub_id = ""
                if tenant_doc:
                    pub_id = (tenant_doc.get("beehiiv_publication_id") or "").strip()
                if not pub_id:
                    pub_id = (os.getenv("BEEHIIV_PUBLICATION_ID", "") or "").strip()
                if api_key and pub_id:
                    ext_id, err = await publish_to_beehiiv(
                        api_key,
                        pub_id,
                        subject,
                        html_body or "<p></p>",
                    )
                    if err:
                        logger.warning(
                            "newsletter_publisher.beehiiv_failed",
                            extra={"campaign_id": campaign_id, "error": err},
                        )
                        update_doc(
                            "newsletter_campaigns",
                            campaign_id,
                            {"status": "failed", "error_message": err},
                            tenant_id=tenant_id,
                        )
                        continue
                else:
                    logger.info(
                        "newsletter_publisher.beehiiv_skipped",
                        extra={
                            "campaign_id": campaign_id,
                            "reason": "Beehiiv API key or publication id not configured",
                        },
                    )
                    continue

            update_doc(
                "newsletter_campaigns",
                campaign_id,
                {"status": "sent"},
                tenant_id=tenant_id,
            )

            logger.info(
                "newsletter_publisher.published",
                extra={"campaign_id": campaign_id, "platform": platform},
            )
    except Exception as exc:
        logger.error(
            "newsletter_publisher.publish_newsletters.error",
            extra={"error": str(exc)},
        )
    logger.info("newsletter_publisher.publish_newsletters.done")
