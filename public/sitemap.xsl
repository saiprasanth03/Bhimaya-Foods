<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
		<head>
			<title>XML Sitemap</title>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
			<style type="text/css">
				body {
					font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
					font-size: 14px;
					color: #333;
					margin: 0;
					padding: 40px;
					background: #f9fafb;
				}
				.container {
					max-width: 1000px;
					margin: 0 auto;
					background: #fff;
					padding: 40px;
					border-radius: 12px;
					box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
				}
				h1 {
					color: #111;
					font-size: 28px;
					margin-bottom: 8px;
					font-weight: 700;
				}
				p {
					color: #6b7280;
					margin-bottom: 24px;
					line-height: 1.5;
				}
				a {
					color: #ef4444;
					text-decoration: none;
					font-weight: 500;
				}
				a:hover {
					text-decoration: underline;
				}
				table {
					width: 100%;
					border-collapse: collapse;
					margin-top: 20px;
				}
				th {
					text-align: left;
					padding: 12px 16px;
					background: #f3f4f6;
					border-bottom: 2px solid #e5e7eb;
					color: #374151;
					font-weight: 600;
				}
				td {
					padding: 12px 16px;
					border-bottom: 1px solid #f3f4f6;
					word-break: break-all;
				}
				tr:hover td {
					background: #fef2f2;
				}
				.priority-badge {
					display: inline-block;
					padding: 2px 8px;
					border-radius: 12px;
					background: #fee2e2;
					color: #b91c1c;
					font-size: 11px;
					font-weight: 700;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h1>XML Sitemap</h1>
				<p>This is a human-readable XML Sitemap, meant for consumption by search engines like Google or Bing.</p>
				<p>You can find more information about XML sitemaps on <a href="http://sitemaps.org">sitemaps.org</a>.</p>
				
				<table>
					<thead>
						<tr>
							<th width="70%">URL</th>
							<th width="15%">Priority</th>
							<th width="15%">Last Modified</th>
						</tr>
					</thead>
					<tbody>
						<xsl:for-each select="sitemap:urlset/sitemap:url">
							<tr>
								<td>
									<xsl:variable name="itemURL">
										<xsl:value-of select="sitemap:loc"/>
									</xsl:variable>
									<a href="{$itemURL}">
										<xsl:value-of select="sitemap:loc"/>
									</a>
								</td>
								<td>
									<span class="priority-badge">
										<xsl:value-of select="concat(sitemap:priority*100, '%')"/>
									</span>
								</td>
								<td>
									<xsl:value-of select="sitemap:lastmod"/>
								</td>
							</tr>
						</xsl:for-each>
					</tbody>
				</table>
			</div>
		</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
